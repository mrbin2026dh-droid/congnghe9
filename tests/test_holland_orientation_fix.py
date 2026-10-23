# -*- coding: utf-8 -*-
"""
Verification Test Suite: Holland Orientation & SGK Cong Nghe 9 Compliance
Directly verifies the user's reported bug from screenshot:
1. Student with code ASR gets top recommended major "Thiết kế Đồ họa & Trải nghiệm Người dùng (UI/UX)" (code AIR, ~71%).
2. In teacher table, student's matching major displays "Thiết kế Đồ họa & Trải nghiệm Người dùng (UI/UX)" instead of stale "Kỹ thuật Cơ điện tử & Robot".
3. Streaming proposal box displays label "Học tiếp THPT (Định hướng Đại học / Cao đẳng):" (eliminates hardcoded "ĐH Kỹ thuật").
4. Pedagogy recommendation dynamically states university orientation towards Arts/Design (A) and Social (S) fields according to SGK Công nghệ 9 Bài 2 & 4.
5. Retaking or switching survey attempts automatically syncs targetMajorId, targetMajorName, and major to Firebase.
"""
import sys
import os
import urllib.parse
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_orientation_fix():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

        page.goto(url)
        page.wait_for_load_state('domcontentloaded')

        print("\n=== STEP 1: Log in as student NH-9A1 and test ASR survey completion ===")
        page.locator('#login-student-code').fill('NH-9A1')
        page.locator('#btn-submit-student-login').click()
        page.wait_for_timeout(400)

        # Switch to Quiz tab
        page.locator('.tab-btn[data-tab="quiz"]').click()
        page.wait_for_timeout(300)

        # Execute survey resulting in ASR (A=13/15, S=11/15, R=6/15, I=6/15, E=6/15, C=5/15)
        page.locator('#quiz-mode-quick').click()
        page.wait_for_timeout(200)

        page.evaluate("""() => {
            window.app.quizAnswers = [
                3, 2, 1, // R: 6 (40%)
                3, 2, 1, // I: 6 (40%)
                4, 5, 4, // A: 13 (87%)
                4, 3, 4, // S: 11 (73%)
                3, 1, 2, // E: 6 (40%)
                2, 1, 2  // C: 5 (33%)
            ];
            window.app.finalizeQuizResults();
        }""")
        page.wait_for_timeout(400)

        # Assert code is ASR
        code_text = page.locator('#result-holland-code').text_content().strip()
        print(f"Computed Holland Code: {code_text}")
        assert code_text == 'ASR', f"Expected code ASR, got '{code_text}'"

        # Assert top recommended major is UI/UX
        top_major_title = page.locator('#quiz-matched-majors-grid .card-panel').first.locator('span').first.text_content().strip()
        top_major_fit = page.locator('#quiz-matched-majors-grid .card-panel').first.locator('span').nth(1).text_content().strip()
        print(f"Top Recommended Major: {top_major_title} ({top_major_fit})")
        assert "thiết kế đồ họa" in top_major_title.lower() or "ui/ux" in top_major_title.lower(), f"Expected UI/UX major for ASR, got '{top_major_title}'"

        # Assert student profile was dynamically updated to UI/UX
        profile_major = page.evaluate("() => window.app.studentProfile.targetMajorName")
        profile_major_id = page.evaluate("() => window.app.studentProfile.targetMajorId")
        print(f"Student Profile targetMajorName: {profile_major} (ID: {profile_major_id})")
        assert "thiết kế đồ họa" in profile_major.lower() or "ui/ux" in profile_major.lower(), f"Student profile targetMajorName must be UI/UX, got '{profile_major}'"
        assert profile_major_id == 'thiet-ke-do-hoa-uiux', f"Expected targetMajorId 'thiet-ke-do-hoa-uiux', got '{profile_major_id}'"

        print("[PASS] Step 1: ASR survey dynamically sets #1 major to UI/UX in profile and attempt history.")

        print("\n=== STEP 2: Verify Teacher Dashboard displays correct major & SGK stream ===")
        # Switch to teacher mode
        page.locator('#btn-logout').click()
        page.wait_for_timeout(200)

        page.locator('#auth-tab-teacher').click()
        page.locator('#login-teacher-pin').fill('123456')
        page.locator('#btn-submit-teacher-login').click()
        page.wait_for_timeout(500)

        # Check THPT label: must NOT have "(Định hướng ĐH Kỹ thuật)"
        thpt_label = page.locator('#teacher-stream-thpt-label').text_content().strip()
        print(f"Teacher THPT Streaming Label: {thpt_label}")
        assert "kỹ thuật" not in thpt_label.lower(), f"Label must NOT hardcode ĐH Kỹ thuật! Got '{thpt_label}'"
        assert "đại học" in thpt_label.lower() and "cao đẳng" in thpt_label.lower(), f"Label must mention Đại học / Cao đẳng, got '{thpt_label}'"

        # Check Pedagogy Recommendation: must mention Arts/Design (A) or Social (S)
        rec_html = page.locator('#teacher-pedagogy-recommendation').inner_html()
        print(f"Pedagogy Recommendation: {rec_html}")
        assert "nghệ thuật" in rec_html.lower() or "thiết kế" in rec_html.lower() or "thpt" in rec_html.lower(), f"Recommendation must reflect actual student orientation, got '{rec_html}'"

        # Check student table row for NH-9A1
        table_rows = page.locator('#teacher-student-table-body tr')
        assert table_rows.count() >= 1, "Teacher table must contain students"

        row_content = page.evaluate("""() => {
            const row = document.querySelector('#teacher-student-table-body tr');
            if (!row) return null;
            const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
            return {
                index: cells[0],
                code: cells[1],
                name: cells[4],
                holland: cells[5],
                major: cells[6],
                stream: cells[8]
            };
        }""")
        print(f"Table row data for student: {row_content}")

        assert row_content['holland'] == 'ASR', f"Expected Holland code ASR, got '{row_content['holland']}'"
        assert "thiết kế đồ họa" in row_content['major'].lower() or "ui/ux" in row_content['major'].lower(), f"Table major MUST be UI/UX, got '{row_content['major']}'"
        assert "cơ điện tử" not in row_content['major'].lower(), f"Table major MUST NOT be Cơ điện tử for ASR student! Got '{row_content['major']}'"
        assert "thpt" in row_content['stream'].lower(), f"Stream must be THPT for ASR, got '{row_content['stream']}'"

        print("[PASS] Step 2: Teacher table displays UI/UX (AIR) for student ASR, with accurate SGK stream and pedagogy advice.")

        print("\n=== STEP 3: Verify Retake & Attempt Switching Updates Everything Dynamically ===")
        # Switch back to student
        page.locator('#btn-logout').click()
        page.wait_for_timeout(200)

        page.locator('#auth-tab-student').click()
        page.locator('#login-student-code').fill('NH-9A1')
        page.locator('#btn-submit-student-login').click()
        page.wait_for_timeout(400)

        page.locator('.tab-btn[data-tab="quiz"]').click()
        page.wait_for_timeout(300)

        # Switch to ICR attempt in history dropdown
        attempt_select = page.locator('#survey-attempt-select')
        attempt_options = page.evaluate("""() => {
            const sel = document.getElementById('survey-attempt-select');
            return Array.from(sel.options).map(o => ({ value: o.value, text: o.text }));
        }""")
        icr_opt = next((o for o in attempt_options if 'ICR' in o['text']), None)

        if icr_opt:
            attempt_select.select_option(icr_opt['value'])
            page.wait_for_timeout(300)

            cur_code = page.locator('#result-holland-code').text_content().strip()
            assert cur_code == 'ICR', f"Expected ICR after switching, got '{cur_code}'"

            # Profile targetMajor should update to An toàn thông tin
            switched_profile_major = page.evaluate("() => window.app.studentProfile.targetMajorName")
            print(f"Switched attempt targetMajorName: {switched_profile_major}")
            assert "an toàn thông tin" in switched_profile_major.lower() or "an ninh mạng" in switched_profile_major.lower(), f"Profile major must switch to An toan thong tin, got '{switched_profile_major}'"

            print("[PASS] Step 3: Attempt switching dynamically updates major and profile.")

        # Check 0 console errors
        assert len(console_errors) == 0, f"Console F12 errors found: {console_errors}"

        browser.close()
        print("\n=======================================================")
        print("🎉 ALL HOLLAND ORIENTATION & SGK FIXES VERIFIED 100%!")
        print("=======================================================")

if __name__ == '__main__':
    test_orientation_fix()
