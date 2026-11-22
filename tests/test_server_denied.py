# -*- coding: utf-8 -*-
"""
Tái hiện sự cố 22/11/2026: Firebase Rules (test mode) hết hạn -> máy chủ TỪ CHỐI mọi truy cập (401 Permission denied)
trong khi máy VẪN CÓ MẠNG. Trước đây app báo nhầm "Máy đang mất mạng".

Kiểm thử thật (Chromium + Firebase Emulator, đổi Rules của Emulator sang khóa toàn bộ):
 1. Máy chưa từng đăng nhập: báo "máy chủ TỪ CHỐI truy cập", KHÔNG báo "mất mạng"; báo ngay, không treo.
 2. Máy đã từng đăng nhập (có dữ liệu lưu): học sinh vẫn vào học tiếp được, kèm cảnh báo máy chủ.
 3. Giáo viên trên máy mới: báo máy chủ từ chối (không báo mất mạng).
 4. Giáo viên trên máy đã đăng nhập trước đó: vào được, bảng có thông báo máy chủ từ chối + dữ liệu đã lưu.
 5. Mở lại Rules: tiến độ học sinh làm trong lúc sự cố được đồng bộ lên máy chủ.
 6. Không có lỗi JavaScript (ngoài cảnh báo permission_denied dự kiến của Firebase SDK).

Chạy:  python tests/test_server_denied.py
"""
import json
import os
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from playwright.sync_api import sync_playwright  # noqa: E402
import test_emulator_survey_resume as base  # noqa: E402
from test_emulator_survey_resume import PASSED, check, db_request, draft_count, start_processes, stop_processes, wait_student  # noqa: E402
from test_offline_devices import logout, open_app, teacher_login, try_student_login  # noqa: E402

OPEN_RULES = {'rules': {'.read': True, '.write': True}}
LOCKED_RULES = {'rules': {'.read': False, '.write': False}}  # giống test mode đã hết hạn


def set_rules(rules):
    req = urllib.request.Request(
        f'{base.DB}/.settings/rules.json?ns={base.NS}', data=json.dumps(rules).encode('utf-8'), method='PUT',
        headers={'Authorization': 'Bearer owner', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status


def read_as_owner(path):
    req = urllib.request.Request(f'{base.DB}/{path}.json?ns={base.NS}', headers={'Authorization': 'Bearer owner'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8') or 'null') or {}


def run():
    set_rules(OPEN_RULES)
    db_request('PUT', '', {
        'settings': {'teacherPin': '2026'},
        'students': {
            '9G-01': {'studentCode': '9G-01', 'name': 'Đỗ Minh Châu', 'grade': '9G', 'school': 'THCS Test'},
            '9G-02': {'studentCode': '9G-02', 'name': 'Bùi Anh Tuấn', 'grade': '9G', 'school': 'THCS Test'}
        }
    })
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Máy A đã dùng từ trước (học sinh 9G-01 + giáo viên đã đăng nhập khi máy chủ còn hoạt động)
        dev_a = browser.new_context(viewport={'width': 1366, 'height': 820})
        page = open_app(dev_a, errors)
        ok, _, err = try_student_login(page, '9G-01')
        check('Trước sự cố: học sinh 9G-01 đăng nhập bình thường', ok, err)
        logout(page)
        ok, err = teacher_login(page)
        check('Trước sự cố: giáo viên đăng nhập bình thường', ok, err)
        page.wait_for_function('() => window.app.teacherLiveConnected === true', timeout=15000)
        logout(page)

        print('\n=== Máy chủ khóa toàn bộ quyền truy cập (Rules hết hạn), máy VẪN CÓ MẠNG ===')
        set_rules(LOCKED_RULES)
        try:
            urllib.request.urlopen(f'{base.DB}/students.json?ns={base.NS}', timeout=10)
            locked = False
        except urllib.error.HTTPError as e:
            locked = e.code == 401
        check('Emulator trả 401 Permission denied giống Firebase thật', locked)

        # 1. Máy mới
        print('\n[1] Học sinh trên máy chưa từng đăng nhập')
        dev_b = browser.new_context(viewport={'width': 1280, 'height': 800})
        pb = open_app(dev_b, errors)
        ok, secs, err = try_student_login(pb, '9G-02')
        check('Không đăng nhập được (máy chưa có dữ liệu)', not ok)
        check('Báo đúng: máy chủ TỪ CHỐI truy cập', 'TỪ CHỐI' in err, err)
        check('KHÔNG báo nhầm là "mất mạng"', 'mất mạng' not in err, err)
        check('Có hướng dẫn kiểm tra Rules cho thầy cô', 'Rules' in err)
        check(f'Báo ngay ({secs:.1f}s), không treo', secs < 5)

        # 3. Giáo viên máy mới
        print('\n[3] Giáo viên trên máy mới')
        ok, err = teacher_login(pb, '2026')
        check('Giáo viên máy mới: báo máy chủ từ chối (không báo mất mạng)', not ok and 'TỪ CHỐI' in err and 'mất mạng' not in err, err)
        dev_b.close()

        # 2. Máy đã từng đăng nhập
        print('\n[2] Học sinh trên máy đã từng đăng nhập')
        ok, secs, err = try_student_login(page, '9G-01')
        check('Vẫn vào học tiếp được bằng dữ liệu lưu trên máy', ok, err)
        toast = page.evaluate('() => [...document.querySelectorAll(".teenvoca-toast")].map(t => t.textContent).join(" | ")')
        check('Có cảnh báo máy chủ đang từ chối truy cập', 'từ chối truy cập' in toast, toast)
        page.locator('.tab-btn[data-tab="quiz"]').click()
        for v in [5, 4, 3]:
            page.locator(f'#quiz-likert-container .likert-btn[data-value="{v}"]').click()
            page.wait_for_timeout(60)
        page.wait_for_timeout(1500)
        check('Làm được 3 câu trong lúc sự cố', page.evaluate('() => window.app.quizAnswers.filter(a => a !== null).length') == 3)
        logout(page)

        # 4. Giáo viên máy cũ
        print('\n[4] Giáo viên trên máy đã đăng nhập trước đó')
        ok, err = teacher_login(page, '2026')
        check('Giáo viên vào được bằng PIN đã xác minh trước đó', ok, err)
        page.wait_for_selector('#teacher-offline-banner', state='visible', timeout=15000)
        page.wait_for_function('() => document.getElementById("teacher-offline-banner").textContent.includes("TỪ CHỐI")', timeout=15000)
        check('Bảng giáo viên báo rõ máy chủ từ chối truy cập', 'TỪ CHỐI' in page.locator('#teacher-offline-banner').inner_text())
        check('Bảng giáo viên vẫn có dữ liệu lớp đã lưu', page.evaluate('() => TeacherAnalytics.currentClassData.length') >= 2)
        logout(page)

        # 5. Khắc phục
        print('\n[5] Thầy cô mở lại Rules')
        set_rules(OPEN_RULES)
        ok, _, err = try_student_login(page, '9G-01')
        check('Sau khắc phục: học sinh đăng nhập bình thường (có mạng)', ok, err)
        deadline = time.time() + 30
        st = {}
        while time.time() < deadline:
            st = read_as_owner('students/9G-01')
            if draft_count(st) == 3:
                break
            time.sleep(0.5)
        check('3 câu làm trong lúc sự cố đã lên máy chủ', draft_count(st) == 3, str(draft_count(st)))
        dev_a.close()
        browser.close()

    print('\n[6] Lỗi console F12')
    expected = ('permission_denied', 'Permission denied', 'Failed to load resource', 'net::ERR', 'favicon')
    real = [e for e in errors if not any(x in e for x in expected)]
    for e in real:
        print('   ', e)
    check('Không có lỗi JavaScript ngoài cảnh báo quyền truy cập dự kiến', not real, f'{len(real)} lỗi')


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    procs = start_processes()
    try:
        run()
        print(f'\n🎉 ĐẠT {len(PASSED)}/{len(PASSED)} kiểm tra sự cố máy chủ từ chối truy cập.')
    except Exception as exc:
        print(f'\n❌ {exc}')
        print(f'Đã đạt {len(PASSED)} kiểm tra trước khi lỗi.')
        sys.exit(1)
    finally:
        try:
            set_rules(OPEN_RULES)
        except Exception:
            pass
        stop_processes(procs)
