# -*- coding: utf-8 -*-
"""
Kiểm thử thật (trình duyệt Chromium + Firebase Emulator chạy trên máy, KHÔNG đụng dữ liệu thật):
Học sinh đã khảo sát lần 1, bấm "Khảo sát lại", làm dở rồi thoát ra / mất mạng.

Kịch bản:
 1. Học sinh hoàn thành lần 1 (bản rút gọn 18 câu) -> Firebase có mã Holland.
 2. Bấm "Khảo sát lại", làm 5 câu -> Firebase VẪN giữ mã cũ + có bản nháp 5 câu;
    bảng giáo viên vẫn "đã khảo sát" kèm nhãn "Đang làm 5/18".
 3. Đăng xuất, đăng nhập lại ở MÁY KHÁC -> mở đúng câu 6, kết quả cũ còn nguyên.
 4. Mất mạng khi đang làm (không đóng trang) -> có mạng lại thì Firebase tự nhận đủ câu.
 5. Mất mạng rồi ĐÓNG TRANG khi vẫn đăng nhập -> mở lại khi có mạng: tiến độ được đẩy lên Firebase.
 6. Mất mạng rồi ĐĂNG XUẤT -> đăng nhập lại trên cùng máy khi có mạng: khôi phục đủ câu.
 7. Hoàn thành lần 2 -> kết quả mới thay kết quả cũ, lịch sử 2 lần, bản nháp bị xóa.
 8. Dữ liệu cũ bị phiên bản trước xóa trắng mã -> tự khôi phục kết quả từ lịch sử.
 9. Không có lỗi JavaScript trong console F12.

Chạy:  python tests/test_emulator_survey_resume.py
Yêu cầu: Java, firebase-tools (npx firebase), Playwright (python).
"""
import json
import os
import socket
import subprocess
import sys
import time
import urllib.request

from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EMULATOR_DIR = os.path.join(ROOT, 'tests', 'emulator')
EMU_PORT = 9400
WEB_PORT = 8765
NS = 'edupath-ai-huongnghiep-default-rtdb'
DB = f'http://127.0.0.1:{EMU_PORT}'
PAGE_URL = f'http://127.0.0.1:{WEB_PORT}/index.html?emulator=1&emulatorPort={EMU_PORT}'
QUICK_TOTAL = 18

PASSED = []


def check(label, condition, detail=''):
    if not condition:
        raise AssertionError(f'FAIL: {label} {detail}')
    PASSED.append(label)
    print(f'  ✓ {label}')


# ---------------------------------------------------------------- hạ tầng
def port_open(port):
    with socket.socket() as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0


def db_request(method, path, data=None):
    body = None if data is None else json.dumps(data).encode('utf-8')
    req = urllib.request.Request(f'{DB}/{path}.json?ns={NS}', data=body, method=method,
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8') or 'null')


def get_student(code):
    return db_request('GET', f'students/{code}') or {}


def draft_count(student):
    d = (student or {}).get('surveyDraft') or {}
    return sum(1 for ch in str(d.get('answers', '')) if ch in '12345')


def wait_until(fn, timeout=15, interval=0.3):
    end = time.time() + timeout
    last = None
    while time.time() < end:
        last = fn()
        if last:
            return last
        time.sleep(interval)
    return last


def wait_student(code, predicate, timeout=20):
    """Chờ tới khi bản ghi học sinh trên Emulator thỏa điều kiện; luôn trả về bản ghi mới nhất (dict)."""
    last = {}
    end = time.time() + timeout
    while time.time() < end:
        last = get_student(code)
        if predicate(last):
            break
        time.sleep(0.3)
    return last


def start_processes():
    procs = []
    if not port_open(EMU_PORT):
        print('Khởi động Firebase Emulator...')
        procs.append(subprocess.Popen(
            'npx --no-install firebase emulators:start --only database --project demo-teenvoca',
            cwd=EMULATOR_DIR, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL))
        if not wait_until(lambda: port_open(EMU_PORT), timeout=60, interval=1):
            raise RuntimeError('Không khởi động được Firebase Emulator')
    if not port_open(WEB_PORT):
        procs.append(subprocess.Popen(
            [sys.executable, '-m', 'http.server', str(WEB_PORT), '--bind', '127.0.0.1'],
            cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL))
        wait_until(lambda: port_open(WEB_PORT), timeout=15)
    return procs


def stop_processes(procs):
    for p in procs:
        if os.name == 'nt':
            subprocess.call(['taskkill', '/T', '/F', '/PID', str(p.pid)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            p.terminate()


# ---------------------------------------------------------------- thao tác trang
def open_page(ctx, errors):
    page = ctx.new_page()
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
    page.on('dialog', lambda d: d.accept())
    page.goto(PAGE_URL)
    page.wait_for_load_state('domcontentloaded')
    page.wait_for_function('() => window.app && window.EduPathUsingEmulator === true', timeout=15000)
    return page


def student_login(page, code):
    page.locator('#login-student-code').fill(code)
    page.locator('#btn-submit-student-login').click()
    page.wait_for_function('() => window.app.currentUser && window.app.currentUser.role === "student"', timeout=15000)


def teacher_login(page):
    page.locator('#auth-tab-teacher').click()
    page.locator('#login-teacher-pin').fill('2026')
    page.locator('#btn-submit-teacher-login').click()
    page.wait_for_function('() => window.app.currentUser && window.app.currentUser.role === "teacher"', timeout=15000)


def go_quiz(page):
    page.locator('.tab-btn[data-tab="quiz"]').click()
    page.wait_for_timeout(300)


def answer(page, value):
    page.locator(f'#quiz-likert-container .likert-btn[data-value="{value}"]').click()
    page.wait_for_timeout(60)


def state(page):
    return page.evaluate('''() => ({
        view: window.app.quizView,
        idx: window.app.currentQuestionIdx,
        answered: window.app.quizAnswers.filter(a => a !== null).length,
        total: window.app.quizQuestions.length,
        code: window.app.studentProfile.code,
        activeVisible: getComputedStyle(document.getElementById('quiz-active-card')).display !== 'none',
        resultVisible: getComputedStyle(document.getElementById('quiz-result-card')).display !== 'none',
        progress: (document.getElementById('quiz-progress-text') || {}).textContent || '',
        retakeLabel: (document.getElementById('btn-retake-quiz') || {}).textContent || '',
        backVisible: getComputedStyle(document.getElementById('btn-back-to-last-result')).display !== 'none'
    })''')


def teacher_row(page, code):
    return page.evaluate('''(code) => {
        for (const tr of document.querySelectorAll('#teacher-student-table-body tr')) {
            const tds = tr.querySelectorAll('td');
            if (tds.length >= 7 && tds[1].textContent.includes(code)) {
                return { holland: tds[5].textContent.replace(/\\s+/g, ' ').trim(), major: tds[6].textContent.trim() };
            }
        }
        return null;
    }''', code)


# ---------------------------------------------------------------- kịch bản
def run():
    # Dữ liệu mẫu trên Emulator (xóa sạch trước)
    db_request('PUT', '', {
        'settings': {'teacherPin': '2026'},
        'students': {
            '9C-01': {'studentCode': '9C-01', 'name': 'Nguyễn Văn An', 'grade': '9C', 'school': 'THCS Test'},
        }
    })

    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        teacher_ctx = browser.new_context(viewport={'width': 1440, 'height': 900})
        teacher = open_page(teacher_ctx, errors)
        teacher_login(teacher)

        # ---------- 1. Hoàn thành lần 1
        print('\n[1] Học sinh hoàn thành lần 1 (bản rút gọn)')
        dev1 = browser.new_context(viewport={'width': 1366, 'height': 800})
        page = open_page(dev1, errors)
        student_login(page, '9C-01')
        go_quiz(page)
        page.locator('#quiz-mode-quick').click()
        first = [1, 1, 1, 2, 2, 2, 5, 5, 5, 4, 4, 4, 3, 3, 3, 1, 1, 1]
        for v in first:
            answer(page, v)
        code1 = wait_until(lambda: get_student('9C-01').get('code'))
        check('Lần 1: Firebase có mã Holland', bool(code1) and len(code1) == 3, str(code1))
        check('Lần 1: hiện thẻ kết quả', state(page)['resultVisible'])

        # ---------- 2. Khảo sát lại, làm 5 câu
        print('\n[2] Bấm "Khảo sát lại" và làm 5 câu')
        page.locator('#btn-retake-quiz').click()
        page.wait_for_timeout(200)
        check('Khảo sát lại: mở thẻ câu hỏi', state(page)['activeVisible'])
        for v in [5, 5, 5, 5, 5]:
            answer(page, v)
        st = wait_student('9C-01', lambda s: draft_count(s) == 5, timeout=20)
        check('Đang làm dở: Firebase có bản nháp 5 câu', draft_count(st) == 5, json.dumps(st.get('surveyDraft')))
        check('Đang làm dở: Firebase VẪN giữ mã lần 1', st.get('code') == code1, str(st.get('code')))
        check('Đang làm dở: Firebase vẫn giữ ngành cũ', bool(st.get('major')))
        row = wait_until(lambda: (lambda r: r if r and 'Đang làm' in r['holland'] else None)(teacher_row(teacher, '9C-01')))
        check('Giáo viên: vẫn thấy mã cũ', bool(row) and row['holland'].startswith(code1), str(row))
        check('Giáo viên: có nhãn "Đang làm 5/18"', bool(row) and 'Đang làm 5/18' in row['holland'], str(row))

        # ---------- 3. Đăng xuất, đăng nhập lại ở máy khác
        print('\n[3] Thoát ra, đăng nhập lại ở MÁY KHÁC')
        page.locator('#btn-logout').click()
        page.wait_for_timeout(300)
        dev1.close()
        dev2 = browser.new_context(viewport={'width': 1366, 'height': 800})
        page = open_page(dev2, errors)
        student_login(page, '9C-01')
        go_quiz(page)
        s = state(page)
        check('Máy khác: mở lại bài đang làm', s['activeVisible'] and s['view'] == 'active', str(s))
        check('Máy khác: tiếp tục từ câu 6', s['idx'] == 5 and s['progress'].startswith('Câu hỏi 6 / 18'), str(s))
        check('Máy khác: 5 câu đã làm còn nguyên', s['answered'] == 5, str(s))
        check('Máy khác: kết quả cũ còn nguyên', s['code'] == code1, str(s))
        check('Máy khác: có nút "Xem kết quả lần trước"', s['backVisible'])

        # ---------- 4. Mất mạng giữa chừng, KHÔNG đóng trang
        print('\n[4] Mất mạng khi đang làm (không đóng trang), rồi có mạng lại')
        dev2.set_offline(True)
        for v in [4, 4]:
            answer(page, v)
        page.wait_for_timeout(1500)
        check('Mất mạng: Firebase chưa nhận 2 câu mới', draft_count(get_student('9C-01')) == 5)
        check('Mất mạng: trang vẫn ghi nhận 7 câu', state(page)['answered'] == 7)
        dev2.set_offline(False)
        st = wait_student('9C-01', lambda s: draft_count(s) == 7, timeout=40)
        check('Có mạng lại: Firebase tự nhận đủ 7 câu', draft_count(st) == 7, str(draft_count(st)))

        # ---------- 5. Mất mạng rồi ĐÓNG TRANG khi vẫn đăng nhập
        print('\n[5] Mất mạng rồi đóng trang (vẫn đăng nhập), mở lại khi có mạng')
        dev2.set_offline(True)
        for v in [3, 3]:
            answer(page, v)
        page.wait_for_timeout(1200)
        check('Mất mạng: Firebase vẫn 7 câu', draft_count(get_student('9C-01')) == 7)
        page.close()
        dev2.set_offline(False)
        page = open_page(dev2, errors)
        st = wait_student('9C-01', lambda s: draft_count(s) == 9, timeout=40)
        check('Mở lại trang: tiến độ 9 câu được đẩy lên Firebase', draft_count(st) == 9, str(draft_count(st)))
        go_quiz(page)
        s = state(page)
        check('Mở lại trang: tiếp tục từ câu 10', s['answered'] == 9 and s['idx'] == 9, str(s))

        # ---------- 6. Mất mạng rồi ĐĂNG XUẤT, đăng nhập lại khi có mạng
        print('\n[6] Mất mạng rồi đăng xuất, đăng nhập lại trên cùng máy khi có mạng')
        dev2.set_offline(True)
        for v in [2, 2]:
            answer(page, v)
        page.locator('#btn-logout').click()
        page.wait_for_timeout(1000)
        check('Mất mạng + đăng xuất: Firebase vẫn 9 câu', draft_count(get_student('9C-01')) == 9)
        page.close()
        dev2.set_offline(False)
        page = open_page(dev2, errors)
        student_login(page, '9C-01')
        go_quiz(page)
        s = state(page)
        check('Đăng nhập lại: khôi phục đủ 11 câu từ bản sao lưu trên máy', s['answered'] == 11, str(s))
        check('Đăng nhập lại: kết quả cũ vẫn còn', s['code'] == code1, str(s))
        st = wait_student('9C-01', lambda s: draft_count(s) == 11, timeout=20)
        check('Đăng nhập lại: Firebase nhận đủ 11 câu', draft_count(st) == 11, str(draft_count(st)))

        # ---------- Xem kết quả cũ rồi tiếp tục
        page.locator('#btn-back-to-last-result').click()
        page.wait_for_timeout(300)
        s = state(page)
        check('Xem kết quả lần trước: hiện mã cũ', s['resultVisible'] and s['code'] == code1, str(s))
        check('Nút đổi thành "Tiếp tục bài đang làm dở (11/18 câu)"', 'Tiếp tục bài đang làm dở (11/18' in s['retakeLabel'], s['retakeLabel'])
        page.locator('#btn-retake-quiz').click()
        page.wait_for_timeout(300)
        check('Bấm "Tiếp tục": vẫn 11 câu', state(page)['answered'] == 11)

        # ---------- 7. Hoàn thành lần 2
        print('\n[7] Hoàn thành lần 2')
        while state(page)['answered'] < QUICK_TOTAL:
            answer(page, 5 if state(page)['idx'] < 9 else 1)
        st = wait_student('9C-01', lambda s: len(s.get('surveyHistory') or []) == 2 and not s.get('surveyDraft'), timeout=20)
        check('Lần 2 xong: lịch sử có 2 lần', len(st.get('surveyHistory') or []) == 2, str(st))
        check('Lần 2 xong: bản nháp đã xóa', not st.get('surveyDraft'))
        check('Lần 2 xong: mã Firebase là của lần 2', st.get('code') == state(page)['code'], f"{st.get('code')} vs {state(page)['code']}")
        row = wait_until(lambda: (lambda r: r if r and 'Đang làm' not in r['holland'] else None)(teacher_row(teacher, '9C-01')))
        check('Giáo viên: hết nhãn "Đang làm"', bool(row), str(teacher_row(teacher, '9C-01')))

        # ---------- 8. Dữ liệu cũ bị phiên bản trước xóa trắng mã
        print('\n[8] Học sinh có dữ liệu cũ bị xóa trắng mã Holland')
        db_request('PUT', 'students/9C-02', {
            'studentCode': '9C-02', 'name': 'Trần Thị Bình', 'grade': '9C', 'school': 'THCS Test',
            'code': '', 'major': '', 'activeAttemptId': '', 'surveyHistory': st.get('surveyHistory')
        })
        page.locator('#btn-logout').click()
        page.wait_for_timeout(300)
        student_login(page, '9C-02')
        go_quiz(page)
        s = state(page)
        check('Dữ liệu cũ: khôi phục mã từ lịch sử', len(s['code']) == 3 and s['resultVisible'], str(s))
        restored = wait_until(lambda: get_student('9C-02').get('code'))
        check('Dữ liệu cũ: Firebase được khôi phục mã', restored == s['code'], str(restored))

        browser.close()

    # ---------- 9. Console F12
    print('\n[9] Lỗi console F12')
    ignorable = ('net::ERR_INTERNET_DISCONNECTED', 'Failed to load resource', 'ERR_NETWORK')
    real_errors = [e for e in errors if not any(x in e for x in ignorable)]
    for e in real_errors:
        print('   ', e)
    check('Không có lỗi JavaScript trong console', not real_errors, f'{len(real_errors)} lỗi')


if __name__ == '__main__':
    procs = start_processes()
    try:
        run()
        print(f'\n🎉 ĐẠT {len(PASSED)}/{len(PASSED)} kiểm tra trên Firebase Emulator + Chromium thật.')
    except Exception as exc:
        print(f'\n❌ {exc}')
        print(f'Đã đạt {len(PASSED)} kiểm tra trước khi lỗi.')
        sys.exit(1)
    finally:
        stop_processes(procs)
