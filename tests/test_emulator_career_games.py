# -*- coding: utf-8 -*-
"""
Kiểm thử thật phân hệ Trò chơi Nghề nghiệp (Chromium + Firebase Emulator, KHÔNG đụng dữ liệu thật).

 1. Học sinh mở tab "🎮 Trò Chơi Nghề Nghiệp": sảnh có 4 trò, điểm thành tích 0.
 2. Thám tử nghề nghiệp: đoán sai bị trừ điểm + mở manh mối, đoán đúng được cộng; kết thúc lưu kỉ lục lên Firebase.
 3. Phân loại RIASEC: đúng 12/12 -> 120 điểm, huy hiệu "Chuyên gia RIASEC".
 4. Một ngày làm nghề: ra mã trải nghiệm 3 chữ cái, lưu lên Firebase.
 5. Đố vui SGK: 1 câu hết giờ + 9 câu đúng -> huy hiệu "Học giả SGK", "Nhà thám hiểm nghề".
 6. Giáo viên thấy cột điểm trò chơi và bảng xếp hạng cập nhật realtime.
 7. Tải lại trang / đăng nhập máy khác: điểm và huy hiệu còn nguyên.
 8. Tên học sinh chứa mã độc không chạy trên bảng xếp hạng (chặn XSS).
 9. Không có lỗi JavaScript trong console.

Chạy:  python tests/test_emulator_career_games.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from playwright.sync_api import sync_playwright  # noqa: E402
from test_emulator_survey_resume import (  # noqa: E402
    PASSED, check, db_request, get_student, open_page, start_processes, stop_processes,
    student_login, teacher_login, wait_student
)


def go_games(page):
    page.locator('.tab-btn[data-tab="games"]').click()
    page.wait_for_selector('#games-root .games-grid', timeout=5000)


def hub_points(page):
    return int(page.locator('#games-root .games-score-num').inner_text().strip())


def shown_score(page):
    txt = page.locator('#games-root .game-chip-score').inner_text()
    return int(''.join(ch for ch in txt if ch.isdigit()) or 0)


def start_game(page, game_id):
    page.locator(f'#games-root [data-action="start"][data-game="{game_id}"]').click()
    page.wait_for_timeout(100)


def finish_points(page):
    page.wait_for_selector('#games-root .game-finish', timeout=5000)
    return int(page.locator('#games-root .game-finish-score strong').inner_text().strip())


def stats_of(code):
    return (get_student(code) or {}).get('gameStats') or {}


def teacher_game_cell(page, code):
    return page.evaluate('''(code) => {
        for (const tr of document.querySelectorAll('#teacher-student-table-body tr')) {
            const tds = tr.querySelectorAll('td');
            if (tds.length >= 11 && tds[1].textContent.includes(code)) return tds[9].textContent.replace(/\\s+/g, ' ').trim();
        }
        return null;
    }''', code)


def run():
    db_request('PUT', '', {
        'settings': {'teacherPin': '2026'},
        'students': {
            '9A-01': {'studentCode': '9A-01', 'name': 'Lê Minh Khang', 'grade': '9A', 'school': 'THCS Test'},
            '9A-02': {
                'studentCode': '9A-02', 'name': '<img src=x onerror="window.__xss=1">', 'grade': '9A', 'school': 'THCS Test',
                'gameStats': {'best': {'detective': 100, 'riasec': 50, 'dayinlife': 0, 'sgkquiz': 0},
                              'plays': {'detective': 1, 'riasec': 1, 'dayinlife': 0, 'sgkquiz': 0},
                              'badges': {'first_game': '2026-11-19T00:00:00.000Z'}}
            }
        }
    })

    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        teacher_ctx = browser.new_context(viewport={'width': 1440, 'height': 900})
        teacher = open_page(teacher_ctx, errors)
        teacher_login(teacher)

        dev1 = browser.new_context(viewport={'width': 1366, 'height': 820})
        page = open_page(dev1, errors)
        student_login(page, '9A-01')

        # ---------- 1. Sảnh trò chơi
        print('\n[1] Sảnh trò chơi')
        go_games(page)
        check('Sảnh có đủ 4 trò chơi', page.locator('#games-root .game-card').count() == 4)
        check('Điểm thành tích ban đầu = 0', hub_points(page) == 0)
        check('Có 8 huy hiệu, tất cả đang khóa', page.locator('#games-root .game-badge.locked').count() == 8)
        check('Biểu tượng huy hiệu vẽ bằng SVG (không phụ thuộc phông emoji của máy)',
              page.locator('#games-root .game-badge svg.badge-svg').count() == 8)

        # ---------- 2. Thám tử nghề nghiệp
        print('\n[2] Thám tử nghề nghiệp')
        start_game(page, 'detective')
        for case_no in range(5):
            answer = page.evaluate('''() => {
                const first = document.querySelector('#games-root .detective-clue').textContent;
                const c = CareerGames.DETECTIVE_CASES.find(x => first.includes(x.clues[0]));
                return c ? c.answer : null;
            }''')
            check(f'Vụ {case_no + 1}: nhận diện được đáp án từ manh mối 1', bool(answer))
            if case_no == 0:
                wrong = page.evaluate('''(ans) => [...document.querySelectorAll('#games-root [data-action="detective-guess"]')]
                    .map(b => b.getAttribute('data-value')).find(v => v !== ans)''', answer)
                page.locator(f'#games-root [data-action="detective-guess"][data-value="{wrong}"]').click()
                check('Đoán sai: mở thêm manh mối 2', page.locator('#games-root .detective-clue').count() == 2)
                check('Đoán sai: đáp án sai bị khóa', page.locator(f'#games-root [data-value="{wrong}"]').is_disabled())
                page.locator('#games-root [data-action="detective-clue"]').click()
                check('Xem manh mối: hiện manh mối 3', page.locator('#games-root .detective-clue').count() == 3)
            page.locator(f'#games-root [data-action="detective-guess"][data-value="{answer}"]').click()
            check(f'Vụ {case_no + 1}: báo đúng', page.locator('#games-root .game-feedback.ok').count() == 1)
            if case_no == 0:
                check('Vụ 1: điểm = 100 − 30 (sai) − 20 (manh mối) = 50', shown_score(page) == 50, str(shown_score(page)))
            page.locator('#games-root [data-action="detective-next"]').click()
        det_points = finish_points(page)
        check('Thám tử: tổng điểm = 50 + 4×100 = 450', det_points == 450, str(det_points))
        st = wait_student('9A-01', lambda s: ((s.get('gameStats') or {}).get('best') or {}).get('detective') == 450)
        check('Thám tử: Firebase lưu kỉ lục 450', ((st.get('gameStats') or {}).get('best') or {}).get('detective') == 450, str(st.get('gameStats')))
        badges = (st.get('gameStats') or {}).get('badges') or {}
        check('Huy hiệu "Khởi động" + "Thám tử tài ba"', 'first_game' in badges and 'detective_master' in badges, str(badges))

        # ---------- 3. Phân loại RIASEC
        print('\n[3] Phân loại nghề RIASEC')
        page.locator('#games-root [data-action="hub"]').first.click()
        start_game(page, 'riasec')
        for _ in range(12):
            t = page.evaluate('''() => {
                const name = document.querySelector('#games-root .riasec-card-name').textContent.trim();
                const c = CareerGames.RIASEC_CARDS.find(x => x.name === name);
                return c ? c.type : null;
            }''')
            page.locator(f'#games-root [data-action="riasec-pick"][data-value="{t}"]').click()
            page.locator('#games-root [data-action="riasec-next"]').click()
        rpts = finish_points(page)
        check('RIASEC: đúng 12/12 = 120 điểm', rpts == 120, str(rpts))
        st = wait_student('9A-01', lambda s: 'riasec_expert' in (((s.get('gameStats') or {}).get('badges')) or {}))
        check('RIASEC: huy hiệu "Chuyên gia RIASEC" trên Firebase', 'riasec_expert' in ((st.get('gameStats') or {}).get('badges') or {}))

        # ---------- 4. Một ngày làm nghề
        print('\n[4] Một ngày làm nghề')
        page.locator('#games-root [data-action="hub"]').first.click()
        start_game(page, 'dayinlife')
        for _ in range(8):
            page.locator('#games-root [data-action="day-pick"]').first.click()
            page.wait_for_timeout(40)
        dpts = finish_points(page)
        code = page.locator('#games-root .day-code').inner_text().strip()
        check('Một ngày làm nghề: 100 điểm hoàn thành', dpts == 100)
        check('Một ngày làm nghề: có mã trải nghiệm 3 chữ cái RIASEC', len(code) == 3 and all(ch in 'RIASEC' for ch in code), code)
        st = wait_student('9A-01', lambda s: (s.get('gameStats') or {}).get('dayInLifeCode') == code)
        check('Một ngày làm nghề: Firebase lưu mã trải nghiệm', (st.get('gameStats') or {}).get('dayInLifeCode') == code)

        # ---------- 5. Đố vui SGK (câu 1 để hết giờ)
        print('\n[5] Đố vui SGK (câu 1 để hết giờ ~21 giây)')
        page.locator('#games-root [data-action="hub"]').first.click()
        start_game(page, 'sgkquiz')
        page.wait_for_selector('#games-root .game-feedback.bad', timeout=25000)
        check('Hết giờ: báo "Hết giờ" và khóa đáp án', 'Hết giờ' in page.locator('#games-root .game-feedback').inner_text())
        page.locator('#games-root [data-action="quiz-next"]').click()
        for _ in range(9):
            correct = page.evaluate('''() => {
                const q = document.querySelector('#games-root .game-question').textContent.trim();
                const item = CareerGames.SGK_QUESTIONS.find(x => x.q === q);
                return item ? item.options[0] : null;
            }''')
            page.locator('#games-root [data-action="quiz-answer"]').filter(has_text=correct).first.click()
            page.locator('#games-root [data-action="quiz-next"]').click()
        qpts = finish_points(page)
        check('Đố vui: đúng 9/10, điểm trong khoảng 9×10..9×20', 90 <= qpts <= 180, str(qpts))
        st = wait_student('9A-01', lambda s: 'explorer' in (((s.get('gameStats') or {}).get('badges')) or {}))
        gs = st.get('gameStats') or {}
        check('Huy hiệu "Học giả SGK" + "Nhà thám hiểm nghề"', 'sgk_scholar' in gs.get('badges', {}) and 'explorer' in gs.get('badges', {}), str(gs.get('badges')))
        expected_total = 450 + 120 + 100 + qpts
        check(f'Firebase: điểm thành tích = {expected_total}', gs.get('achievementPoints') == expected_total, str(gs.get('achievementPoints')))
        page.locator('#games-root [data-action="hub"]').first.click()
        check('Sảnh hiện đúng điểm thành tích', hub_points(page) == expected_total, str(hub_points(page)))

        # ---------- 6. Giáo viên
        print('\n[6] Bảng giáo viên')
        teacher.wait_for_timeout(1500)
        cell = teacher_game_cell(teacher, '9A-01')
        check('Cột "🎮 Trò chơi" hiện điểm thành tích', bool(cell) and cell.startswith(str(expected_total)), str(cell))
        first_row = teacher.locator('#teacher-games-leaderboard tbody tr').first.inner_text()
        check('Bảng xếp hạng: 9A-01 đứng hạng 1', '9A-01' in first_row and '🥇' in first_row, first_row)
        check('Bảng xếp hạng: có 2/2 em tham gia', '2/2' in teacher.locator('#teacher-games-leaderboard .game-chip').inner_text())

        # ---------- 7. Tải lại trang & máy khác
        print('\n[7] Tải lại trang và đăng nhập máy khác')
        page.reload()
        page.wait_for_function('() => window.app && window.EduPathUsingEmulator === true')
        go_games(page)
        page.wait_for_timeout(800)
        check('Tải lại trang: điểm còn nguyên', hub_points(page) == expected_total, str(hub_points(page)))
        dev2 = browser.new_context(viewport={'width': 1280, 'height': 800})
        page2 = open_page(dev2, errors)
        student_login(page2, '9A-01')
        go_games(page2)
        check('Máy khác: điểm thành tích từ Firebase', hub_points(page2) == expected_total, str(hub_points(page2)))
        check('Máy khác: huy hiệu đã mở khóa', page2.locator('#games-root .game-badge.owned').count() >= 6)

        # ---------- 8. Chặn XSS
        print('\n[8] Chặn mã độc trong tên học sinh')
        check('Tên chứa mã độc hiển thị dạng chữ, không chạy', teacher.evaluate('() => window.__xss') is None)
        check('Tên hiển thị nguyên văn trên bảng xếp hạng', '<img' in teacher.locator('#teacher-games-leaderboard').inner_text())

        browser.close()

    print('\n[9] Lỗi console F12')
    real = [e for e in errors if not any(x in e for x in ('Failed to load resource', 'ERR_INTERNET_DISCONNECTED', 'favicon'))]
    for e in real:
        print('   ', e)
    check('Không có lỗi JavaScript trong console', not real, f'{len(real)} lỗi')


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
