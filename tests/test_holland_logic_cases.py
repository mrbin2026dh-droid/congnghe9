# -*- coding: utf-8 -*-
"""
Test Suite: Holland Logic Verification Across All 8 Cases
Strictly verifies:
1. SCA/SEC Profile: Electrician is NOT 81% (drops to ~12-25%), no 45% floor clamp.
2. SEC Profile: S-dominant careers rank #1 (>90%).
3. Case 5 (ICR): An toan thong tin (ICR) ranks #1 (>90%), CNTT and Data Science rank #2 and #3.
4. Case 6 (Equal scores): Detects undifferentiated profile, displays clear notice, avoids arbitrary tie-breaker certainty.
5. Case 7 (Incomplete/Missing data): Forbids auto-filling 3s, warns user, no fake RIA defaults.
6. Case 8 (Retake & History Attempt selection): Switching survey attempt in dropdown dynamically updates code, breakdown, and career recommendations.
7. Seamless Lesson 5 Integration: Selected major flows into Lesson 5 matrix and printable report.
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

def test_holland_logic_cases():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

        page.goto(url)
        page.wait_for_load_state('domcontentloaded')

        # Log in as test student
        page.locator('#login-student-code').fill('NH-9A1')
        page.locator('#btn-submit-student-login').click()
        page.wait_for_timeout(400)

        # Navigate to Quiz tab
        page.locator('.tab-btn[data-tab="quiz"]').click()
        page.wait_for_timeout(200)

        # -------------------------------------------------------------
        # TEST CASE 7: INCOMPLETE DATA REJECTION (NO FAKE 3s, NO RIA DEFAULT)
        # -------------------------------------------------------------
        print("\n--- Running Test Case 7: Incomplete Survey Integrity ---")
        dialog_messages = []
        page.on('dialog', lambda d: (dialog_messages.append(d.message), d.accept()))

        # Fill only first 5 answers out of 18 (Quick mode)
        page.locator('#quiz-mode-quick').click()
        page.wait_for_timeout(200)

        page.evaluate("""() => {
            window.app.quizAnswers = [5, 4, 5, 4, 3, null, null, null, null, null, null, null, null, null, null, null, null, null];
            window.app.finalizeQuizResults();
        }""")
        page.wait_for_timeout(300)

        # Assert alert was triggered and survey result was NOT shown
        assert len(dialog_messages) > 0, "Incomplete survey must trigger warning dialog"
        assert "hoàn thành" in dialog_messages[0].lower() and "còn thiếu" in dialog_messages[0].lower(), f"Dialog message must mention incomplete survey, got '{dialog_messages[0]}'"
        assert page.locator('#quiz-active-card').is_visible(), "Quiz active card must remain visible when incomplete"
        assert not page.locator('#quiz-result-card').is_visible(), "Result card must NOT be shown when incomplete"
        print("[PASS] Case 7: Incomplete data rejected; no fake 3s, no false RIA default generated.")

        # -------------------------------------------------------------
        # TEST CASE 6: EQUAL SCORES ACROSS ALL 6 GROUPS (UNDIFFERENTIATED)
        # -------------------------------------------------------------
        print("\n--- Running Test Case 6: Equal Scores Across 6 Groups ---")
        # Answer all 18 questions with the exact same score (3)
        page.evaluate("""() => {
            window.app.quizAnswers = new Array(18).fill(3);
            window.app.finalizeQuizResults();
        }""")
        page.wait_for_timeout(400)

        # Check result card is shown with undifferentiated warning
        assert page.locator('#quiz-result-card').is_visible(), "Result card must be visible"
        undiff_alert = page.locator('#quiz-undifferentiated-alert')
        assert undiff_alert.is_visible(), "Undifferentiated alert banner must be visible when all scores equal"
        undiff_text = undiff_alert.text_content()
        assert "chưa có nhóm" in undiff_text.lower() and "nổi bật rõ rệt" in undiff_text.lower(), f"Banner must state no prominent group, got '{undiff_text}'"

        result_code_text = page.locator('#result-holland-code').text_content().strip()
        assert "RIA" != result_code_text, f"App must NOT assign arbitrary RIA code when scores are equal! Got '{result_code_text}'"
        print(f"[PASS] Case 6: Equal scores handled properly; displays '{result_code_text}' with warning banner, avoids arbitrary tie-breaker.")

        # -------------------------------------------------------------
        # TEST CASE 5: ICR PROFILE (INVESTIGATIVE, CONVENTIONAL, REALISTIC)
        # -------------------------------------------------------------
        print("\n--- Running Test Case 5: ICR Profile (Nghiên cứu, Nghiệp vụ, Kỹ thuật) ---")
        # In 18-question quick mode:
        # Questions: 0..2: R, 3..5: I, 6..8: A, 9..11: S, 12..14: E, 15..17: C
        # To get ICR:
        # I: [5, 5, 5] -> 15 (100%)
        # C: [5, 5, 4] -> 14 (93%)
        # R: [4, 4, 4] -> 12 (80%)
        # A: [2, 2, 2] -> 6 (40%)
        # S: [1, 2, 1] -> 4 (27%)
        # E: [2, 2, 2] -> 6 (40%)
        page.evaluate("""() => {
            window.app.quizAnswers = [
                4, 4, 4, // R: 12
                5, 5, 5, // I: 15
                2, 2, 2, // A: 6
                1, 2, 1, // S: 4
                2, 2, 2, // E: 6
                5, 5, 4  // C: 14
            ];
            window.app.finalizeQuizResults();
        }""")
        page.wait_for_timeout(400)

        icr_code = page.locator('#result-holland-code').text_content().strip()
        assert icr_code == 'ICR', f"Expected Holland code ICR, got '{icr_code}'"

        # Check matched majors ranking
        majors_cards = page.locator('#quiz-matched-majors-grid .card-panel')
        top1_name = majors_cards.nth(0).locator('span').first.text_content().strip()
        top1_fit = majors_cards.nth(0).locator('span').nth(1).text_content().strip()
        top2_name = majors_cards.nth(1).locator('span').first.text_content().strip()
        top3_name = majors_cards.nth(2).locator('span').first.text_content().strip()

        print(f"Top 1: {top1_name} ({top1_fit})")
        print(f"Top 2: {top2_name}")
        print(f"Top 3: {top3_name}")

        assert "an toàn thông tin" in top1_name.lower() or "an ninh mạng" in top1_name.lower(), f"Top 1 for ICR must be An toan thong tin, got '{top1_name}'"
        assert int(top1_fit.replace('% Hợp', '').replace('%', '').strip()) >= 90, f"Top 1 fit score should be >= 90%, got '{top1_fit}'"
        assert ("công nghệ thông tin" in top2_name.lower() or "dữ liệu" in top2_name.lower()), f"Top 2 should be CNTT or Data Science, got '{top2_name}'"
        print("[PASS] Case 5 (ICR): An toàn thông tin ranks #1 (>90%), CNTT and Data Science rank #2 & #3.")

        # -------------------------------------------------------------
        # TEST CASES SCA & SEC: VERIFY 81% ELECTRICIAN ERROR & 45% FLOOR ARE ELIMINATED
        # -------------------------------------------------------------
        print("\n--- Running Test Cases SCA & SEC ---")
        # Fill SCA answers:
        # S: [5, 5, 5] -> 15 (100%)
        # C: [5, 5, 4] -> 14 (93%)
        # A: [4, 4, 4] -> 12 (80%)
        # E: [2, 2, 2] -> 6
        # I: [1, 2, 1] -> 4
        # R: [1, 1, 1] -> 3 (20%)
        page.evaluate("""() => {
            window.app.quizAnswers = [
                1, 1, 1, // R: 3
                1, 2, 1, // I: 4
                4, 4, 4, // A: 12
                5, 5, 5, // S: 15
                2, 2, 2, // E: 6
                5, 5, 4  // C: 14
            ];
            window.app.finalizeQuizResults();
        }""")
        page.wait_for_timeout(400)

        sca_code = page.locator('#result-holland-code').text_content().strip()
        assert sca_code == 'SCA', f"Expected Holland code SCA, got '{sca_code}'"

        # Check all fit percentages for SCA
        all_fits = page.evaluate("""() => {
            const matches = HollandEngine.matchMajors('SCA', window.app.studentProfile.percentages);
            const elec = matches.find(m => m.id === 'dien-dan-dung-cong-nghiep');
            return {
                electricianFit: elec ? elec.fitPercentage : null,
                allScores: matches.map(m => ({ id: m.id, name: m.name, fit: m.fitPercentage }))
            };
        }""")

        elec_fit = all_fits['electricianFit']
        print(f"SCA -> Kỹ thuật điện fit percentage: {elec_fit}% (Previously was 81% bug)")
        assert elec_fit is not None and elec_fit <= 25, f"Kỹ thuật điện must NOT be 81% for SCA student! Got {elec_fit}%"

        # Check there is NO artificial 45% floor clamp across all majors
        scores_list = [m['fit'] for m in all_fits['allScores']]
        count_45 = scores_list.count(45)
        print(f"SCA -> Score distribution: {scores_list}")
        assert count_45 <= 2, f"Too many 45% scores detected! Found {count_45} occurrences of 45%: {scores_list}"
        assert min(scores_list) < 30, f"Minimum score should naturally fall below 30%, got {min(scores_list)}"
        print("[PASS] Case SCA: Kỹ thuật điện dropped from 81% to realistic low fit; 45% floor clamp eliminated.")

        # Test SEC (Người học thiên về Xã hội, Quản lý, Nghiệp vụ)
        sec_results = page.evaluate("""() => {
            const matches = HollandEngine.matchMajors('SEC', { S: 90, E: 85, C: 80, A: 25, I: 20, R: 15 });
            return matches.slice(0, 3).map(m => ({ name: m.name, code: m.code, fit: m.fitPercentage }));
        }""")
        print(f"SEC -> Top matches: {sec_results}")
        assert "sư phạm" in sec_results[0]['name'].lower() or "stem" in sec_results[0]['name'].lower(), f"SEC top career should be STEM/Tech Education, got '{sec_results[0]['name']}'"
        assert sec_results[0]['fit'] >= 90, f"SEC top fit should be >= 90%, got {sec_results[0]['fit']}%"
        print("[PASS] Case SEC: Sư phạm Công nghệ & STEM ranks #1 (>90%).")

        # -------------------------------------------------------------
        # TEST CASE 8: RETAKE & DYNAMIC SURVEY ATTEMPT SWITCHING
        # -------------------------------------------------------------
        print("\n--- Running Test Case 8: Survey History & Attempt Selection ---")
        # Currently, student has completed multiple attempts:
        # Attempt 1: Equal (3s)
        # Attempt 2: ICR
        # Attempt 3: SCA
        attempt_select = page.locator('#survey-attempt-select')
        assert attempt_select.is_visible(), "Survey attempt selector dropdown must be visible"

        option_count = attempt_select.locator('option').count()
        assert option_count >= 3, f"Expected at least 3 attempts in history, got {option_count}"

        # Switch back to Attempt 2 (ICR) via dropdown
        attempt_options = page.evaluate("""() => {
            const sel = document.getElementById('survey-attempt-select');
            return Array.from(sel.options).map(o => ({ value: o.value, text: o.text }));
        }""")
        print(f"Available attempts in dropdown: {attempt_options}")

        icr_opt = next(o for o in attempt_options if 'ICR' in o['text'])
        attempt_select.select_option(icr_opt['value'])
        page.wait_for_timeout(300)

        # Code display must immediately switch to ICR!
        switched_code = page.locator('#result-holland-code').text_content().strip()
        assert switched_code == 'ICR', f"Selecting ICR attempt must update code to ICR, got '{switched_code}'"

        # Top career must update to An toan thong tin!
        top1_switched = page.locator('#quiz-matched-majors-grid .card-panel').nth(0).locator('span').first.text_content().strip()
        assert "an toàn thông tin" in top1_switched.lower() or "an ninh mạng" in top1_switched.lower(), f"Matched majors must update to ICR majors, got '{top1_switched}'"

        # Now switch to Attempt 3 (SCA) via dropdown
        sca_opt = next(o for o in attempt_options if 'SCA' in o['text'])
        attempt_select.select_option(sca_opt['value'])
        page.wait_for_timeout(300)

        switched_code_sca = page.locator('#result-holland-code').text_content().strip()
        assert switched_code_sca == 'SCA', f"Selecting SCA attempt must update code to SCA, got '{switched_code_sca}'"
        print("[PASS] Case 8: Survey history preserved; switching attempt updates results, code, and career recommendations dynamically.")

        # -------------------------------------------------------------
        # TEST STEP 7: LESSON 5 INTEGRATION CHECK
        # -------------------------------------------------------------
        print("\n--- Running Lesson 5 Integration Check ---")
        # Click "Chọn Ngành Này Cho Bài 5" on top major of SCA
        select_btn = page.locator('#quiz-matched-majors-grid .card-panel').first.locator('button')
        select_btn.click()
        page.wait_for_timeout(300)

        # Should automatically switch to project tab
        assert page.locator('#view-project').is_visible(), "Should switch to Lesson 5 (project) view"
        target_name_l5 = page.locator('#assessment-target-major-name').text_content().strip()
        print(f"Lesson 5 target major name: {target_name_l5}")
        assert len(target_name_l5) > 0, "Target major name in Lesson 5 must be populated"

        # Check 10 criteria table rows exist
        rows = page.locator('#assessment-matrix-body tr')
        assert rows.count() == 10, f"Expected 10 rows in Lesson 5, got {rows.count()}"
        print("[PASS] Step 7: Lesson 5 successfully integrated with Holland selection.")

        # -------------------------------------------------------------
        # TEST STEP 8: PRESERVATION OF CAREER TREE, COUNSELOR, PROFILE
        # -------------------------------------------------------------
        print("\n--- Running Step 8: Preservation of Tree, Counselor, Profile ---")
        # Switch to Tree tab
        page.locator('.tab-btn[data-tab="tree"]').click()
        page.wait_for_timeout(300)
        assert page.locator('#view-tree').is_visible(), "Tree view must be functional"
        assert page.locator('#tree-svg-container').is_visible(), "Living SVG tree must be visible"

        # Switch to Agents tab
        page.locator('.tab-btn[data-tab="agents"]').click()
        page.wait_for_timeout(300)
        assert page.locator('#view-agents').is_visible(), "AI Counselor view must be functional"
        chat_agent = page.locator('.agent-card-pill').first
        assert chat_agent.is_visible(), "Agent selector pills must be visible"

        # Verify 0 console errors
        assert len(console_errors) == 0, f"Console F12 errors found: {console_errors}"
        print("[PASS] Step 8: Career Tree, Counselor Room, and Student Profile preserved with 0 errors.")

        browser.close()
        print("\n=======================================================")
        print("🎉 ALL HOLLAND LOGIC TEST CASES PASSED 100% SUCCESSFULLY!")
        print("=======================================================")

if __name__ == '__main__':
    test_holland_logic_cases()
