# -*- coding: utf-8 -*-
"""
Kiểm thử thật dùng app KHÔNG CẦN MẠNG trên 3 loại thiết bị (Chromium + Firebase Emulator, ngắt mạng thật):

 A. Điện thoại / máy tính RIÊNG của học sinh
    - Đăng nhập lần đầu (có mạng), làm xong trắc nghiệm, lỡ bấm Đăng xuất
    - MẤT MẠNG: đăng nhập lại được ngay (< 3 giây), kết quả cũ còn nguyên, làm tiếp được
    - Có mạng lại: tiến độ tự đồng bộ lên Firebase (không cần thao tác gì)
 B. Máy tính NHÀ TRƯỜNG dùng chung
    - Giáo viên (có mạng) lọc lớp 9D, bấm "Tải DS lớp về máy"
    - MẤT MẠNG: học sinh CHƯA TỪNG đăng nhập trên máy này vẫn đăng nhập được; nhiều em lần lượt dùng chung máy
      mà không lẫn dữ liệu; lớp khác (không tải) và mã lạ bị báo rõ ràng ngay
    - Có mạng lại: bài làm offline của từng em được đồng bộ lên Firebase
 C. GIÁO VIÊN khi mất mạng
    - Máy đã từng đăng nhập GV: vào được bằng PIN đúng, PIN sai bị từ chối; thấy dữ liệu lớp đã lưu kèm thông báo
    - Thêm/sửa/xóa học sinh khi mất mạng bị chặn với thông báo rõ ràng (không treo)
    - Máy chưa từng đăng nhập GV: KHÔNG vào được bằng PIN mặc định khi mất mạng
 D. Học sinh bị giáo viên xóa: có mạng thì không đăng nhập được và bản lưu offline trên máy bị xóa theo
 E. Không có lỗi JavaScript trong console

Chạy:  python tests/test_offline_devices.py
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from playwright.sync_api import sync_playwright  # noqa: E402
from test_emulator_survey_resume import (  # noqa: E402
    PASSED, PAGE_URL, check, db_request, draft_count, get_student, start_processes, stop_processes, wait_student
)

PHONE_UA = ('Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/126.0.0.0 Mobile Safari/537.36')


def open_app(ctx, errors):
    page = ctx.new_page()
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
    page.on('dialog', lambda d: d.accept())
    page.goto(PAGE_URL)
    page.wait_for_function('() => window.app && window.EduPathUsingEmulator === true', timeout=20000)
    # Chờ service worker điều khiển trang để tải lại được khi mất mạng
    page.wait_for_function('async () => Boolean((await navigator.serviceWorker.ready).active)', timeout=30000)
    return page


def try_student_login(page, code):
    """Đăng nhập học sinh; trả về (thành công?, số giây, thông báo lỗi)."""
    page.locator('#login-student-code').fill(code)
    t0 = time.time()
    page.locator('#btn-submit-student-login').click()
    page.wait_for_function('''(code) => (window.app.currentUser && window.app.currentUser.code === code)
        || getComputedStyle(document.getElementById('student-login-error')).display !== 'none' ''', arg=code, timeout=20000)
    elapsed = time.time() - t0
    ok = page.evaluate('(code) => Boolean(window.app.currentUser && window.app.currentUser.code === code)', code)
    err = '' if ok else page.locator('#student-login-error').inner_text()
    return ok, elapsed, err


def teacher_login(page, pin='2026'):
    page.locator('#auth-tab-teacher').click()
    page.locator('#login-teacher-pin').fill(pin)
    page.locator('#btn-submit-teacher-login').click()
    page.wait_for_function('''() => (window.app.currentUser && window.app.currentUser.role === 'teacher')
        || getComputedStyle(document.getElementById('teacher-login-error')).display !== 'none' ''', timeout=20000)
    ok = page.evaluate('() => Boolean(window.app.currentUser && window.app.currentUser.role === "teacher")')
    err = '' if ok else page.locator('#teacher-login-error').inner_text()
    return ok, err


def logout(page):
    page.locator('#btn-logout').click()
    page.wait_for_function('() => !window.app.currentUser', timeout=10000)


def answer_quiz(page, values):
    page.locator('.tab-btn[data-tab="quiz"]').click()
    page.wait_for_timeout(200)
    for v in values:
        page.locator(f'#quiz-likert-container .likert-btn[data-value="{v}"]').click()
        page.wait_for_timeout(50)


def last_toast(page):
    return page.evaluate('''() => {
        const t = document.querySelectorAll('.teenvoca-toast');
        return t.length ? t[t.length - 1].textContent : '';
    }''')


def run():
    db_request('PUT', '', {
        'settings': {'teacherPin': '2026'},
        'students': {
            '9D-01': {'studentCode': '9D-01', 'name': 'Nguyễn Hải Đăng', 'grade': '9D', 'school': 'THCS Test'},
            '9D-02': {'studentCode': '9D-02', 'name': 'Trần Bảo Ngọc', 'grade': '9D', 'school': 'THCS Test'},
            '9D-03': {'studentCode': '9D-03', 'name': 'Lê Quốc Việt', 'grade': '9D', 'school': 'THCS Test'},
            '9E-01': {'studentCode': '9E-01', 'name': 'Võ Thu Hà', 'grade': '9E', 'school': 'THCS Test'}
        }
    })
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ================= A. THIẾT BỊ RIÊNG =================
        print('\n[A] Điện thoại riêng của học sinh')
        phone = browser.new_context(viewport={'width': 412, 'height': 915}, user_agent=PHONE_UA, is_mobile=True, has_touch=True)
        page = open_app(phone, errors)
        ok, _, err = try_student_login(page, '9D-01')
        check('Lần đầu (có mạng): đăng nhập thành công', ok, err)
        page.locator('.tab-btn[data-tab="quiz"]').click()
        page.locator('#quiz-mode-quick').click()
        answer_quiz(page, [5, 5, 5, 1, 1, 1, 4, 4, 4, 2, 2, 2, 3, 3, 3, 1, 1, 1])
        code1 = wait_student('9D-01', lambda s: bool(s.get('code'))).get('code')
        check('Có mạng: hoàn thành trắc nghiệm, Firebase có mã', bool(code1) and len(code1) == 3, str(code1))
        logout(page)

        phone.set_offline(True)
        page.reload()
        page.wait_for_function('() => window.app', timeout=20000)
        check('Mất mạng: hiện huy hiệu "📴 Offline"', page.locator('#network-status-badge').is_visible())
        ok, secs, err = try_student_login(page, '9D-01')
        check('Mất mạng: lỡ đăng xuất vẫn đăng nhập lại được', ok, err)
        check(f'Mất mạng: đăng nhập nhanh ({secs:.1f}s < 3s), không phải chờ', secs < 3)
        check('Mất mạng: kết quả trắc nghiệm cũ còn nguyên', page.evaluate('() => window.app.studentProfile.code') == code1)
        check('Mất mạng: báo đang dùng dữ liệu trên máy', 'không cần mạng' in last_toast(page))
        page.locator('.tab-btn[data-tab="quiz"]').click()
        page.locator('#btn-retake-quiz').click()
        for v in [4, 4, 4]:
            page.locator(f'#quiz-likert-container .likert-btn[data-value="{v}"]').click()
            page.wait_for_timeout(50)
        page.wait_for_timeout(1200)
        check('Mất mạng: làm tiếp 3 câu, Firebase chưa nhận', draft_count(get_student('9D-01')) == 0)
        phone.set_offline(False)
        st = wait_student('9D-01', lambda s: draft_count(s) == 3, timeout=40)
        check('Có mạng lại: tự đồng bộ 3 câu lên Firebase (không cần thao tác)', draft_count(st) == 3, str(draft_count(st)))
        check('Có mạng lại: mã Holland cũ vẫn giữ trên Firebase', st.get('code') == code1)
        phone.close()

        # ================= B. MÁY TÍNH NHÀ TRƯỜNG =================
        print('\n[B] Máy tính nhà trường dùng chung')
        lab = browser.new_context(viewport={'width': 1366, 'height': 820})
        page = open_app(lab, errors)
        ok, err = teacher_login(page)
        check('GV (có mạng): đăng nhập', ok, err)
        page.wait_for_function('() => [...document.querySelectorAll("#teacher-class-filter-select option")].some(o => o.value === "9D")', timeout=15000)
        page.select_option('#teacher-class-filter-select', '9D')
        page.wait_for_function('() => TeacherAnalytics.currentClassData.length === 3 && window.app.teacherLiveConnected', timeout=15000)
        page.locator('#btn-download-roster-offline').click()
        check('GV tải danh sách lớp 9D về máy', '3 học sinh' in page.locator('#offline-roster-info').inner_text(),
              page.locator('#offline-roster-info').inner_text())
        logout(page)

        lab.set_offline(True)
        page.reload()
        page.wait_for_function('() => window.app', timeout=20000)
        ok, secs, err = try_student_login(page, '9D-02')
        check('Mất mạng: HS chưa từng dùng máy này vẫn đăng nhập được', ok, err)
        check(f'Mất mạng: đăng nhập nhanh ({secs:.1f}s)', secs < 3)
        answer_quiz(page, [5, 4])
        logout(page)
        ok, _, err = try_student_login(page, '9D-03')
        check('Mất mạng: em tiếp theo dùng chung máy đăng nhập được', ok, err)
        page.locator('.tab-btn[data-tab="quiz"]').click()
        check('Không lẫn dữ liệu: em sau không thấy bài của em trước',
              page.evaluate('() => window.app.quizAnswers.filter(a => a !== null).length') == 0)
        check('Không lẫn dữ liệu: đúng tên em sau', page.evaluate('() => window.app.studentProfile.name') == 'Lê Quốc Việt')
        logout(page)
        ok, secs, err = try_student_login(page, '9E-01')
        check('Mất mạng: lớp khác (chưa tải về) bị báo rõ ràng', not ok and 'chưa có dữ liệu' in err, err)
        check(f'Báo lỗi ngay ({secs:.1f}s), không treo', secs < 3)
        ok, _, err = try_student_login(page, '9Z-99')
        check('Mất mạng: mã lạ bị báo rõ ràng', not ok and 'chưa có dữ liệu' in err, err)

        lab.set_offline(False)
        ok, _, err = try_student_login(page, '9D-02')
        check('Có mạng lại: em 9D-02 đăng nhập', ok, err)
        st = wait_student('9D-02', lambda s: draft_count(s) == 2, timeout=30)
        check('Có mạng lại: 2 câu làm lúc offline của 9D-02 lên Firebase', draft_count(st) == 2, str(draft_count(st)))
        logout(page)

        # ================= C. GIÁO VIÊN MẤT MẠNG =================
        print('\n[C] Giáo viên khi mất mạng')
        lab.set_offline(True)
        page.reload()
        page.wait_for_function('() => window.app', timeout=20000)
        ok, err = teacher_login(page, '1234')
        check('Mất mạng: PIN sai bị từ chối', not ok and 'không chính xác' in err, err)
        ok, err = teacher_login(page, '2026')
        check('Mất mạng: máy đã từng đăng nhập GV vào được bằng PIN đúng', ok, err)
        page.wait_for_timeout(500)
        check('Mất mạng: có thông báo đang xem dữ liệu đã lưu', page.locator('#teacher-offline-banner').is_visible())
        rows = page.evaluate('() => TeacherAnalytics.currentClassData.length')
        check(f'Mất mạng: bảng giáo viên có danh sách lớp đã lưu ({rows} HS)', rows >= 3)
        t0 = time.time()
        page.evaluate('() => window.app.saveCrudStudent()')
        check('Mất mạng: thêm/sửa học sinh bị chặn kèm thông báo', 'Cần có mạng' in last_toast(page))
        check('Bị chặn ngay, không treo', time.time() - t0 < 2)
        lab.set_offline(False)
        page.wait_for_function('() => window.app.teacherLiveConnected === true', timeout=30000)
        check('Có mạng lại: bảng giáo viên tự chuyển sang dữ liệu trực tiếp', page.locator('#teacher-offline-banner').is_hidden())
        logout(page)

        fresh = browser.new_context(viewport={'width': 1280, 'height': 800})
        fpage = open_app(fresh, errors)
        fresh.set_offline(True)
        fpage.reload()
        fpage.wait_for_function('() => window.app', timeout=20000)
        ok, err = teacher_login(fpage, '2026')
        check('Máy CHƯA từng đăng nhập GV: không vào được khi mất mạng (kể cả PIN mặc định)', not ok and 'cần có mạng' in err, err)
        fresh.close()

        # ================= D. HỌC SINH BỊ XÓA =================
        print('\n[D] Học sinh đã bị giáo viên xóa')
        db_request('DELETE', 'students/9D-03')
        ok, _, err = try_student_login(page, '9D-03')
        check('Có mạng: học sinh đã bị xóa không đăng nhập được', not ok and 'không tồn tại' in err, err)
        check('Bản lưu offline của học sinh đó bị xóa khỏi máy', page.evaluate('() => OfflineAccounts.get("9D-03") === null'))
        lab.close()
        browser.close()

    print('\n[E] Lỗi console F12')
    ignorable = ('Failed to load resource', 'ERR_INTERNET_DISCONNECTED', 'net::ERR', 'favicon')
    real = [e for e in errors if not any(x in e for x in ignorable)]
    for e in real:
        print('   ', e)
    check('Không có lỗi JavaScript trong console', not real, f'{len(real)} lỗi')


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    procs = start_processes()
    try:
        run()
        print(f'\n🎉 ĐẠT {len(PASSED)}/{len(PASSED)} kiểm tra dùng offline trên 3 loại thiết bị.')
    except Exception as exc:
        print(f'\n❌ {exc}')
        print(f'Đã đạt {len(PASSED)} kiểm tra trước khi lỗi.')
        sys.exit(1)
    finally:
        stop_processes(procs)
