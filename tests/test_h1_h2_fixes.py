# -*- coding: utf-8 -*-
"""
Test Suite: Verify Fixes for H1 & H2
H1: No Holland code means NO orientation stream, NO score, and NO recommended major on Teacher dashboard.
H2:
  - When student completes survey, it saves to Firebase.
  - When student logs out and logs back in, it displays the most recent survey results (NOT question 1).
  - When student clicks "Khảo sát lại", it clears the results on Firebase, and Teacher table live-updates to 'Chưa làm'.
  - When student completes the new survey, it updates Firebase and Teacher table live-updates with new accurate results.
"""
import os
import sys
import time
import json
import urllib.parse
import urllib.request
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def reset_student_firebase(student_id="9C-01"):
    url = f"https://edupath-ai-huongnghiep-default-rtdb.asia-southeast1.firebasedatabase.app/students/{student_id}.json"
    payload = {
        "code": "",
        "major": "",
        "projectScore": None,
        "stream": ""
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.read()

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_h1_and_h2():
    print("Resetting 9C-01 on Firebase before test...")
    reset_student_firebase("9C-01")
    url = get_page_url()
    print("Navigating to:", url)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Teacher Context
        teacher_ctx = browser.new_context(viewport={'width': 1440, 'height': 900})
        teacher_page = teacher_ctx.new_page()

        # Student Context
        student_ctx = browser.new_context(viewport={'width': 1440, 'height': 900})
        student_page = student_ctx.new_page()

        console_errors = []
        teacher_page.on('console', lambda m: console_errors.append(m.text) if m.type == 'error' else None)
        student_page.on('console', lambda m: console_errors.append(m.text) if m.type == 'error' else None)

        # -------------------------------------------------------------
        # STEP 1: TEST H1 - TEACHER TABLE RENDERING FOR UNSURVEYED STUDENT
        # -------------------------------------------------------------
        print("\n=== STEP 1: Verifying H1 on Teacher Dashboard ===")
        teacher_page.goto(url)
        teacher_page.wait_for_load_state('domcontentloaded')
        teacher_page.wait_for_timeout(800)

        # Log in as teacher
        teacher_page.locator('#auth-tab-teacher').click()
        teacher_page.locator('#login-teacher-pin').fill('2026')
        teacher_page.locator('#btn-submit-teacher-login').click()
        teacher_page.wait_for_selector('#view-teacher', state='visible')
        teacher_page.wait_for_timeout(1200)

        # Check student 9C-01 row
        row_data = teacher_page.evaluate("""() => {
            const rows = document.querySelectorAll('#teacher-student-table-body tr');
            for (const tr of rows) {
                const tds = tr.querySelectorAll('td');
                if (tds.length >= 7 && tds[1].textContent.includes('9C-01')) {
                    return {
                        code: tds[1].textContent.trim(),
                        name: tds[4].textContent.trim(),
                        holland: tds[5].textContent.trim(),
                        major: tds[6].textContent.trim(),
                        score: tds[7].textContent.trim(),
                        stream: tds[8].textContent.trim()
                    };
                }
            }
            return null;
        }""")

        print("Teacher table 9C-01 row:", row_data)
        assert row_data is not None, "Student 9C-01 row must exist in teacher table"
        assert row_data['holland'] in ['Chưa làm', 'Chưa phân hóa'], f"Expected Holland 'Chưa làm' or 'Chưa phân hóa', got: '{row_data['holland']}'"
        assert 'Chưa chọn' in row_data['major'], f"Expected Major 'Chưa chọn', got: '{row_data['major']}'"
        assert 'Chưa làm' in row_data['score'], f"Expected Score 'Chưa làm', got: '{row_data['score']}'"
        assert 'Chưa có' in row_data['stream'], f"Expected Stream 'Chưa có', got: '{row_data['stream']}'"
        assert 'Live' not in row_data['stream'], f"Expected Offline 'Chờ' badge, not Live, got: '{row_data['stream']}'"
        print("✓ H1 VERIFIED: Un-surveyed student shows 'Chưa làm', 'Chưa chọn', 'Chưa làm', 'Chưa có (Chờ)'!")

        # -------------------------------------------------------------
        # STEP 2: TEST H2 - STUDENT LOGIN & SURVEY COMPLETION
        # -------------------------------------------------------------
        print("\n=== STEP 2: Student Login & Taking Survey (ASE) ===")
        student_page.goto(url)
        student_page.wait_for_load_state('domcontentloaded')
        student_page.wait_for_timeout(800)

        student_page.locator('#login-student-code').fill('9C-01')
        student_page.locator('#btn-submit-student-login').click()
        student_page.wait_for_timeout(800)

        # Switch to Quiz tab
        student_page.locator('.tab-btn[data-tab="quiz"]').click()
        student_page.wait_for_timeout(400)

        # Switch to 18-question Quick Mode
        student_page.locator('#quiz-mode-quick').click()
        student_page.wait_for_timeout(300)

        # Because student is un-surveyed, question card must be visible
        assert student_page.locator('#quiz-active-card').is_visible(), "Question card must be visible for un-surveyed student"
        assert not student_page.locator('#quiz-result-card').is_visible(), "Result card must be hidden for un-surveyed student"

        # Complete 18 questions to produce ASE profile
        answers = [1, 1, 1, 2, 2, 2, 5, 5, 5, 4, 4, 4, 4, 4, 3, 1, 1, 1]
        for idx, ans in enumerate(answers):
            student_page.locator(f'#quiz-likert-container .likert-btn[data-value="{ans}"]').click()
            student_page.wait_for_timeout(100)

        student_page.wait_for_timeout(1200)

        # Result card must now be visible with ASE code!
        assert student_page.locator('#quiz-result-card').is_visible(), "Result card must be visible after completing survey"
        code_text = student_page.locator('#result-holland-code').text_content().strip()
        print(f"Generated Holland Code: {code_text}")
        assert code_text == 'ASE', f"Expected ASE, got '{code_text}'"

        # Check teacher table live-updated without reloading!
        teacher_page.wait_for_timeout(1500)
        row_after_survey = teacher_page.evaluate("""() => {
            const rows = document.querySelectorAll('#teacher-student-table-body tr');
            for (const tr of rows) {
                const tds = tr.querySelectorAll('td');
                if (tds.length >= 7 && tds[1].textContent.includes('9C-01')) {
                    return {
                        code: tds[1].textContent.trim(),
                        holland: tds[5].textContent.trim(),
                        major: tds[6].textContent.trim(),
                        stream: tds[8].textContent.trim()
                    };
                }
            }
            return null;
        }""")
        print("Teacher table live update after survey:", row_after_survey)
        assert row_after_survey['holland'] == 'ASE', f"Teacher table should live update to ASE, got: '{row_after_survey['holland']}'"
        assert 'Chưa chọn' not in row_after_survey['major'], f"Teacher table should show matched major, got: '{row_after_survey['major']}'"
        print("✓ Live synchronization to Teacher table verified!")

        # -------------------------------------------------------------
        # STEP 3: TEST H2 - LOGOUT & RE-LOGIN DISPLAYS LATEST SURVEY
        # -------------------------------------------------------------
        print("\n=== STEP 3: Logout & Re-login (Display Latest Survey) ===")
        # Log out
        student_page.locator('#btn-logout').click()
        student_page.wait_for_timeout(500)

        # Log back in as 9C-01
        student_page.locator('#login-student-code').fill('9C-01')
        student_page.locator('#btn-submit-student-login').click()
        student_page.wait_for_timeout(800)

        # Go to Quiz tab
        student_page.locator('.tab-btn[data-tab="quiz"]').click()
        student_page.wait_for_timeout(500)

        # MUST show results card directly (NOT question 1)!
        assert student_page.locator('#quiz-result-card').is_visible(), "Result card must be visible upon re-login!"
        assert not student_page.locator('#quiz-active-card').is_visible(), "Question card must be hidden upon re-login!"
        persisted_code = student_page.locator('#result-holland-code').text_content().strip()
        assert persisted_code == 'ASE', f"Persisted Holland code should be ASE, got '{persisted_code}'"
        print("✓ H2 PERSISTENCE VERIFIED: Re-login immediately displays latest survey results (ASE)!")

        # -------------------------------------------------------------
        # STEP 4: TEST H2 - RETAKE SURVEY CLEARS FIREBASE & TEACHER TABLE
        # -------------------------------------------------------------
        print("\n=== STEP 4: Retake Survey (Khảo sát lại) & Clear Firebase ===")
        # Click Retake button
        student_page.locator('#btn-retake-quiz').click()
        student_page.wait_for_timeout(1000)

        # Question card must now be visible, result card hidden
        assert student_page.locator('#quiz-active-card').is_visible(), "Question card must be visible after retake"
        assert not student_page.locator('#quiz-result-card').is_visible(), "Result card must be hidden after retake"
        print("Student view switched back to question 1.")

        # Check teacher table live-updated to 'Chưa làm' / 'Chưa chọn'!
        teacher_page.wait_for_timeout(1500)
        row_after_retake = teacher_page.evaluate("""() => {
            const rows = document.querySelectorAll('#teacher-student-table-body tr');
            for (const tr of rows) {
                const tds = tr.querySelectorAll('td');
                if (tds.length >= 7 && tds[1].textContent.includes('9C-01')) {
                    return {
                        code: tds[1].textContent.trim(),
                        holland: tds[5].textContent.trim(),
                        major: tds[6].textContent.trim(),
                        score: tds[7].textContent.trim(),
                        stream: tds[8].textContent.trim()
                    };
                }
            }
            return null;
        }""")
        print("Teacher table live update after retake:", row_after_retake)
        assert row_after_retake['holland'] == 'Chưa làm', f"Expected Holland 'Chưa làm' after retake, got: '{row_after_retake['holland']}'"
        assert 'Chưa chọn' in row_after_retake['major'], f"Expected Major 'Chưa chọn' after retake, got: '{row_after_retake['major']}'"
        assert 'Chưa làm' in row_after_retake['score'], f"Expected Score 'Chưa làm' after retake, got: '{row_after_retake['score']}'"
        assert 'Chưa có' in row_after_retake['stream'], f"Expected Stream 'Chưa có' after retake, got: '{row_after_retake['stream']}'"
        print("✓ H2 RETAKE VERIFIED: Results cleared on Firebase and Teacher table live-updated to 'Chưa làm'!")

        # -------------------------------------------------------------
        # STEP 5: TEST H2 - SUBMIT NEW SURVEY (RSC) & ACCURATE UPDATE
        # -------------------------------------------------------------
        print("\n=== STEP 5: Complete New Survey with Different Answers (RSC) ===")
        # Switch to 18-question mode
        student_page.locator('#quiz-mode-quick').click()
        student_page.wait_for_timeout(300)

        # Answer with RSC profile:
        answers_rsc = [5, 5, 5, 2, 2, 2, 1, 1, 1, 4, 4, 4, 2, 2, 2, 4, 4, 3]
        for idx, ans in enumerate(answers_rsc):
            student_page.locator(f'#quiz-likert-container .likert-btn[data-value="{ans}"]').click()
            student_page.wait_for_timeout(100)

        student_page.wait_for_timeout(1200)

        # Result card must be visible with RSC code!
        assert student_page.locator('#quiz-result-card').is_visible(), "Result card must be visible after new survey"
        new_code = student_page.locator('#result-holland-code').text_content().strip()
        print(f"New Generated Holland Code: {new_code}")
        assert new_code == 'RSC', f"Expected RSC, got '{new_code}'"

        # Check teacher table live-updated to RSC!
        teacher_page.wait_for_timeout(1500)
        row_after_new_survey = teacher_page.evaluate("""() => {
            const rows = document.querySelectorAll('#teacher-student-table-body tr');
            for (const tr of rows) {
                const tds = tr.querySelectorAll('td');
                if (tds.length >= 7 && tds[1].textContent.includes('9C-01')) {
                    return {
                        code: tds[1].textContent.trim(),
                        holland: tds[5].textContent.trim(),
                        major: tds[6].textContent.trim(),
                        stream: tds[8].textContent.trim()
                    };
                }
            }
            return null;
        }""")
        print("Teacher table live update after new survey:", row_after_new_survey)
        assert row_after_new_survey['holland'] == 'RSC', f"Expected RSC on teacher table, got: '{row_after_new_survey['holland']}'"
        assert 'Chưa chọn' not in row_after_new_survey['major'], f"Expected matching major, got: '{row_after_new_survey['major']}'"
        assert 'Live' in row_after_new_survey['stream'], f"Expected Live badge, got: '{row_after_new_survey['stream']}'"
        print("✓ H2 RE-SURVEY VERIFIED: New accurate results received live on Teacher dashboard!")

        # Check console errors
        print(f"Console errors: {len(console_errors)}")
        if console_errors:
            print("Console error details:", console_errors)
        assert len(console_errors) == 0, f"Found console errors: {console_errors}"

        browser.close()
        print("\n🎉 ALL H1 AND H2 TESTS PASSED 100% PERFECTLY!")

if __name__ == '__main__':
    test_h1_and_h2()
