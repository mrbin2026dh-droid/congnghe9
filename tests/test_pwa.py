# -*- coding: utf-8 -*-
"""
Kiểm thử thật chuẩn PWA (Chromium + Firebase Emulator, không đụng dữ liệu thật).
Chạy trên một BẢN SAO của trang web trong thư mục tạm (để thử được cả luồng "có phiên bản mới").

 1. Chrome đánh giá "có thể cài đặt" (Page.getInstallabilityErrors rỗng), manifest hợp lệ.
 2. Service worker hoạt động, đã lưu đủ tệp ứng dụng + thư viện CDN.
 3. MẤT MẠNG rồi tải lại trang: app vẫn mở, thư viện vẫn chạy, đăng nhập báo "mất kết nối".
 4. Học sinh đã đăng nhập, mất mạng, tải lại: vẫn vào được tab Trắc nghiệm, Trò chơi.
 5. Phím tắt ?tab=games mở thẳng tab Trò chơi.
 6. Nút "📲 Cài ứng dụng": hiện khi trình duyệt cho phép cài, bấm gọi hộp thoại cài đặt.
 7. iPhone/iPad: nút hiện, bấm mở hướng dẫn "Thêm vào MH chính".
 8. Có phiên bản mới: hiện thanh "Cập nhật ngay", bấm thì tải lại sang bản mới.
 9. Không có lỗi JavaScript trong console.

Chạy:  python tests/test_pwa.py
"""
import os
import shutil
import subprocess
import sys
import tempfile
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from playwright.sync_api import sync_playwright  # noqa: E402
import test_emulator_survey_resume as base  # noqa: E402
from test_emulator_survey_resume import PASSED, check, db_request, port_open, wait_until  # noqa: E402

ROOT = base.ROOT
PWA_PORT = 8766
SITE_FILES = ['index.html', 'manifest.webmanifest', 'sw.js']
SITE_DIRS = ['css', 'js', 'icons']
IPHONE_UA = ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 '
             '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')


def copy_site(dest):
    for f in SITE_FILES:
        shutil.copy2(os.path.join(ROOT, f), os.path.join(dest, f))
    for d in SITE_DIRS:
        shutil.copytree(os.path.join(ROOT, d), os.path.join(dest, d))


def url(path='index.html', extra=''):
    sep = '&' if '?' in path else '?'
    return f'http://127.0.0.1:{PWA_PORT}/{path}{sep}emulator=1&emulatorPort={base.EMU_PORT}{extra}'


def wait_app(page):
    page.wait_for_function('() => window.app && window.EduPathUsingEmulator === true', timeout=20000)


def wait_sw_ready(page):
    page.wait_for_function('''async () => {
        const reg = await navigator.serviceWorker.ready;
        return Boolean(reg.active) && Boolean(navigator.serviceWorker.controller);
    }''', timeout=30000)


def run(site_dir):
    db_request('PUT', '', {
        'settings': {'teacherPin': '2026'},
        'students': {'9B-01': {'studentCode': '9B-01', 'name': 'Phạm Gia Huy', 'grade': '9B', 'school': 'THCS Test'}}
    })
    errors = []

    def watch(page):
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
        page.on('dialog', lambda d: d.accept())
        return page

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ---------- 1 & 2. Cài đặt được + service worker
        print('\n[1] Điều kiện cài đặt (bộ kiểm tra của Chrome)')
        ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = watch(ctx.new_page())
        page.goto(url())
        wait_app(page)
        page.evaluate('() => { window.__firstVisit = true; }')
        page.wait_for_function('async () => Boolean((await navigator.serviceWorker.ready).active)', timeout=30000)
        page.wait_for_timeout(1500)
        check('Lần đầu mở trang: không tự tải lại khi cài service worker', page.evaluate('() => window.__firstVisit === true'))
        page.reload()  # lần 2: service worker đã điều khiển trang
        wait_app(page)
        wait_sw_ready(page)
        cdp = ctx.new_cdp_session(page)
        manifest = cdp.send('Page.getAppManifest')
        check('Manifest tải được và không có lỗi', manifest.get('url', '').endswith('manifest.webmanifest') and not manifest.get('errors'), str(manifest.get('errors')))
        inst = wait_until(lambda: (lambda r: r if not r.get('installabilityErrors') else None)(cdp.send('Page.getInstallabilityErrors')), timeout=20)
        check('Chrome xác nhận ứng dụng CÓ THỂ CÀI ĐẶT', inst is not None and not inst.get('installabilityErrors'),
              str(cdp.send('Page.getInstallabilityErrors')))

        print('\n[2] Service worker và bộ nhớ đệm')
        cached = page.evaluate('''async () => {
            const out = [];
            for (const name of await caches.keys()) {
                const c = await caches.open(name);
                for (const req of await c.keys()) out.push(req.url);
            }
            return out;
        }''')
        for must in ['/index.html', '/js/app.js', '/js/career-games.js', '/css/style.css', '/icons/icon-512.png',
                     'gsap.min.js', 'xlsx.full.min.js', 'firebase-app-compat.js', 'firebase-database-compat.js']:
            check(f'Đã lưu đệm: {must}', any(u.endswith(must) for u in cached))
        check('Không lưu đệm file PDF SGK nặng', not any(u.endswith('.pdf') for u in cached))

        # ---------- 3. Offline, chưa đăng nhập
        print('\n[3] Mất mạng rồi tải lại trang (chưa đăng nhập)')
        ctx.set_offline(True)
        page.reload()
        page.wait_for_function('() => window.app', timeout=20000)
        check('Offline: trang vẫn mở được', page.locator('#btn-submit-student-login').is_visible())
        libs = page.evaluate('() => ({ gsap: typeof gsap, xlsx: typeof XLSX, firebase: typeof firebase })')
        check('Offline: thư viện GSAP, SheetJS, Firebase vẫn chạy', all(v != 'undefined' for v in libs.values()), str(libs))
        page.locator('#login-student-code').fill('9B-01')
        page.locator('#btn-submit-student-login').click()
        page.wait_for_selector('#student-login-error', state='visible', timeout=15000)
        check('Offline: đăng nhập báo mất kết nối (không báo sai mã)', 'mất kết nối' in page.locator('#student-login-error').inner_text())
        ctx.set_offline(False)

        # ---------- 4. Học sinh đã đăng nhập, offline
        print('\n[4] Học sinh đã đăng nhập, mất mạng, tải lại')
        page.goto(url())
        wait_app(page)
        page.locator('#login-student-code').fill('9B-01')
        page.locator('#btn-submit-student-login').click()
        page.wait_for_function('() => window.app.currentUser && window.app.currentUser.role === "student"', timeout=15000)
        ctx.set_offline(True)
        page.reload()
        page.wait_for_function('() => window.app && window.app.currentUser', timeout=20000)
        check('Offline: vẫn giữ phiên đăng nhập', page.evaluate('() => window.app.currentUser.code') == '9B-01')
        page.locator('.tab-btn[data-tab="quiz"]').click()
        check('Offline: làm trắc nghiệm được', page.locator('#quiz-likert-container .likert-btn').count() == 5)
        page.locator('#quiz-likert-container .likert-btn[data-value="4"]').click()
        check('Offline: câu trả lời được lưu bản nháp', page.evaluate('() => window.app.quizAnswers.filter(a => a !== null).length') == 1)
        page.locator('.tab-btn[data-tab="games"]').click()
        check('Offline: tab Trò chơi mở được', page.locator('#games-root .game-card').count() == 4)
        ctx.set_offline(False)

        # ---------- 5. Phím tắt
        print('\n[5] Phím tắt ?tab=games')
        page.goto(url('index.html?tab=games'))
        wait_app(page)
        page.wait_for_timeout(500)
        check('Phím tắt mở thẳng tab Trò chơi', page.locator('#view-games').is_visible())

        # ---------- 6. Nút cài đặt (Android/Windows)
        print('\n[6] Nút "Cài ứng dụng"')
        check('Trước khi trình duyệt cho phép cài: nút ẩn', page.locator('#btn-install-app').is_hidden())
        page.evaluate('''() => {
            window.__promptCalled = false;
            const e = new Event('beforeinstallprompt', { cancelable: true });
            e.prompt = () => { window.__promptCalled = true; };
            e.userChoice = Promise.resolve({ outcome: 'accepted' });
            window.dispatchEvent(e);
        }''')
        check('Trình duyệt cho phép cài: nút hiện', page.locator('#btn-install-app').is_visible())
        page.locator('#btn-install-app').click()
        page.wait_for_timeout(300)
        check('Bấm nút: gọi hộp thoại cài đặt của trình duyệt', page.evaluate('() => window.__promptCalled') is True)
        check('Sau khi cài: nút ẩn đi', page.locator('#btn-install-app').is_hidden())
        ctx.close()

        # ---------- 7. iPhone
        print('\n[7] iPhone/iPad (Safari)')
        ios = browser.new_context(viewport={'width': 390, 'height': 844}, user_agent=IPHONE_UA, has_touch=True, is_mobile=True)
        ipage = watch(ios.new_page())
        ipage.goto(url())
        wait_app(ipage)
        check('iPhone (chưa đăng nhập): nút cài hiện ngay trong hộp đăng nhập', ipage.locator('#btn-install-app-modal').is_visible())
        ipage.locator('#btn-install-app-modal').click()
        check('iPhone: mở hướng dẫn "Thêm vào MH chính"', ipage.locator('#pwa-ios-guide').is_visible()
              and 'Thêm vào MH chính' in ipage.locator('#pwa-ios-guide').inner_text())
        ipage.locator('#btn-close-ios-guide').click()
        check('iPhone: đóng được hướng dẫn', ipage.locator('#pwa-ios-guide').is_hidden())
        overflow = ipage.evaluate('() => document.documentElement.scrollWidth > window.innerWidth + 1')
        check('iPhone: không tràn ngang màn hình', not overflow)
        ios.close()

        # ---------- 8. Có phiên bản mới
        print('\n[8] Có phiên bản mới của ứng dụng')
        ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = watch(ctx.new_page())
        page.goto(url())
        wait_app(page)
        page.reload()
        wait_app(page)
        wait_sw_ready(page)
        with open(os.path.join(site_dir, 'sw.js'), 'a', encoding='utf-8') as fh:
            fh.write("\n// test: phiên bản mới\n")
        page.evaluate('async () => { const reg = await navigator.serviceWorker.getRegistration(); await reg.update(); }')
        page.wait_for_selector('#pwa-update-bar', state='visible', timeout=30000)
        check('Hiện thanh "Đã có phiên bản mới"', page.locator('#pwa-update-bar').is_visible())
        page.evaluate('() => { window.__beforeUpdate = true; }')
        page.locator('#btn-pwa-update').click()
        page.wait_for_function('() => !window.__beforeUpdate && window.app', timeout=30000)
        check('Bấm "Cập nhật ngay": trang tải lại sang bản mới', page.evaluate('() => !window.__beforeUpdate'))
        ctx.close()

        browser.close()

    print('\n[9] Lỗi console F12')
    ignorable = ('Failed to load resource', 'ERR_INTERNET_DISCONNECTED', 'net::ERR', 'favicon')
    real = [e for e in errors if not any(x in e for x in ignorable)]
    for e in real:
        print('   ', e)
    check('Không có lỗi JavaScript trong console', not real, f'{len(real)} lỗi')


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    procs = base.start_processes()
    site_dir = tempfile.mkdtemp(prefix='teenvoca_pwa_')
    server = None
    try:
        copy_site(site_dir)
        server = subprocess.Popen([sys.executable, '-m', 'http.server', str(PWA_PORT), '--bind', '127.0.0.1'],
                                  cwd=site_dir, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        wait_until(lambda: port_open(PWA_PORT), timeout=15)
        run(site_dir)
        print(f'\n🎉 ĐẠT {len(PASSED)}/{len(PASSED)} kiểm tra PWA trên Chromium thật.')
    except Exception as exc:
        print(f'\n❌ {exc}')
        print(f'Đã đạt {len(PASSED)} kiểm tra trước khi lỗi.')
        sys.exit(1)
    finally:
        if server:
            base.stop_processes([server])
        base.stop_processes(procs)
        time.sleep(0.5)
        shutil.rmtree(site_dir, ignore_errors=True)
