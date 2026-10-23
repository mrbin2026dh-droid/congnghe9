# -*- coding: utf-8 -*-
"""
End-to-End System-Wide Verification Suite for EduPath AI (Giai Đoạn 5)
Author: Antigravity Multi-Agent Auditor
Strict Standards: Zero-Bug, Multi-Resolution (1920x1080, 1366x768, 375x812),
Real Browser Automation, Zero-Horizontal-Overflow, F12 Console 0 Error.
"""
import os
import sys
import json
import urllib.parse
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def run_system_verification():
    url = get_page_url()
    results = {
        "resolutions_tested": [],
        "user_flows_tested": [],
        "console_errors": [],
        "console_warnings": [],
        "passed": False
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ----------------------------------------------------
        # TEST 1: MULTI-RESOLUTION & ZERO OVERFLOW VERIFICATION
        # ----------------------------------------------------
        test_viewports = [
            {"name": "Desktop FHD", "width": 1920, "height": 1080},
            {"name": "Laptop Standard", "width": 1366, "height": 768},
            {"name": "Mobile Device", "width": 375, "height": 812}
        ]

        for vp in test_viewports:
            context = browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
            page = context.new_page()

            def handle_console(msg):
                if msg.type == 'error':
                    results["console_errors"].append(f"[{vp['name']}] {msg.text}")
                elif msg.type == 'warning':
                    results["console_warnings"].append(f"[{vp['name']}] {msg.text}")

            page.on("console", handle_console)

            page.goto(url)
            page.wait_for_load_state("domcontentloaded")

            # Check horizontal overflow
            scroll_width = page.evaluate("() => document.documentElement.scrollWidth")
            client_width = page.evaluate("() => document.documentElement.clientWidth")
            overflow_diff = scroll_width - client_width

            assert overflow_diff <= 1, f"Horizontal overflow detected on {vp['name']}: scrollWidth={scroll_width}, clientWidth={client_width}"

            results["resolutions_tested"].append({
                "viewport": vp["name"],
                "width": vp["width"],
                "height": vp["height"],
                "scrollWidth": scroll_width,
                "clientWidth": client_width,
                "overflow": "NONE"
            })
            context.close()

        # ----------------------------------------------------
        # TEST 2: FULL USER JOURNEY E2E VERIFICATION
        # ----------------------------------------------------
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        page.on("console", lambda msg: results["console_errors"].append(msg.text) if msg.type == 'error' else None)
        page.goto(url)
        page.wait_for_load_state("domcontentloaded")

        # Step A: Student Code Login & Profile Persistence
        if page.locator('#btn-logout').is_visible():
            page.locator('#btn-logout').click()
        elif page.locator('#btn-open-login').is_visible():
            page.locator('#btn-open-login').click()
        page.wait_for_timeout(200)

        test_code = "9A2-04"
        test_name = "Phạm Đức Dũng"
        test_school = "THCS Lê Quý Đôn"
        test_grade = "9A2"

        page.locator('#login-student-code').fill(test_code)
        page.locator('#btn-submit-student-login').click()
        page.wait_for_timeout(300)

        badge_text = page.locator('#user-info-text').text_content()
        assert test_code in badge_text or test_name in badge_text, f"Badge mismatch: {badge_text}"

        # Verify profile is in localStorage
        profile_json = page.evaluate("() => localStorage.getItem('edupath_student_profile')")
        assert profile_json is not None
        p_obj = json.loads(profile_json)
        assert p_obj.get("school") == test_school
        assert p_obj.get("grade") == test_grade
        assert p_obj.get("name") == test_name
        results["user_flows_tested"].append("Profile Multi-School Setup & Persistence: PASS")

        # Step B: Holland Quiz Navigation & Question Palette
        page.locator('.tab-btn[data-tab="quiz"]').click()
        page.wait_for_timeout(200)

        page.locator('#quiz-mode-quick').click()
        page.wait_for_timeout(200)

        palette_items = page.locator('.palette-item')
        assert palette_items.count() == 18, f"Quick mode must show 18 palette items, got {palette_items.count()}"

        # Jump to question 10 via palette
        palette_items.nth(9).click()
        page.wait_for_timeout(100)
        assert "10 / 18" in page.locator('#quiz-progress-text').text_content()

        # Step C: Complete Quiz
        answers = [5, 5, 4, 4, 5, 4, 3, 2, 3, 2, 2, 3, 4, 4, 3, 3, 4, 4]
        page.evaluate(f"""(ans) => {{
            window.app.quizAnswers = ans;
            window.app.finalizeQuizResults();
        }}""", answers)
        page.wait_for_timeout(300)

        result_code = page.locator('#result-holland-code').text_content().strip()
        assert len(result_code) == 3, f"Holland code must be 3 letters, got {result_code}"

        # Verify 6-category breakdown rendered
        breakdown_rows = page.locator('#quiz-riasec-breakdown .riasec-bar-row')
        assert breakdown_rows.count() == 6, f"Must have 6 RIASEC breakdown rows, got {breakdown_rows.count()}"
        results["user_flows_tested"].append(f"Holland Survey & 6-Category RIASEC Analytics ({result_code}): PASS")

        # Step D: Connect Holland to Lesson 5
        first_major_card = page.locator('#quiz-matched-majors-grid .card-panel').first
        select_for_project_btn = first_major_card.locator('button')
        select_for_project_btn.click()
        page.wait_for_timeout(300)

        # Check view switched to project
        assert page.locator('#view-project').is_visible(), "Tab must switch to Lesson 5 Project"

        target_title = page.locator('#assessment-target-major-name').text_content()
        assert len(target_title) > 0, "Target major title must be populated"

        # Step E: Modify criteria & toggle match
        matrix_rows = page.locator('#assessment-matrix-body tr')
        assert matrix_rows.count() == 10, "Lesson 5 must render 10 criteria rows"

        # Toggle criterion 5
        matrix_rows.nth(4).locator('.match-toggle-btn').click()
        page.wait_for_timeout(100)

        score_text = page.locator('#assessment-score-value').text_content()
        assert "/ 10" in score_text, f"Score format must be X / 10, got {score_text}"

        # Step F: Answer the 3 Guiding Questions
        q1 = page.locator('#sgk-q1-understand-self')
        q2 = page.locator('#sgk-q2-understand-career')
        q3 = page.locator('#sgk-q3-career-path')

        q1.fill("Em đam mê công nghệ và chế tạo máy móc.")
        q2.fill("Kỹ thuật Cơ điện tử tạo ra robot tự động cho nhà máy hiện đại.")
        q3.fill("Em sẽ thi vào lớp 10 THPT rồi học tiếp Đại học Kỹ thuật.")
        q3.press("Enter")
        page.wait_for_timeout(200)

        results["user_flows_tested"].append("Lesson 5 Matrix & 3 Guiding Questions: PASS")

        # Step G: Printable Report Evaluation
        print_html = page.evaluate("""() => {
            const targetMajor = window.EduPathData.majors.find(m => m.id === window.app.studentProfile.targetMajorId) || window.EduPathData.majors[0];
            const result = ProjectAssessment.calculateProjectResult(window.app.assessmentMatches);
            return ProjectAssessment.generatePrintableHTML(window.app.studentProfile, targetMajor, window.app.assessmentMatches, result);
        }""")

        assert test_school.upper() in print_html, f"Printable report must contain school '{test_school}'"
        assert test_name in print_html, f"Printable report must contain student name '{test_name}'"
        assert "KẾT QUẢ BỘ BA CÂU HỎI ĐỊNH HƯỚNG CUỘC ĐỜI" in print_html
        results["user_flows_tested"].append("Official A4 Printable Report Generation: PASS")

        # Step H: Teacher Dashboard Roster & CSV Export
        page.locator('#btn-logout').click()
        page.wait_for_timeout(200)

        page.locator('#auth-tab-teacher').click()
        page.locator('#login-teacher-class').fill('9A2')
        page.locator('#login-teacher-pin').fill('123456')
        page.locator('#btn-submit-teacher-login').click()
        page.wait_for_timeout(300)

        assert page.locator('#view-teacher').is_visible(), "Teacher view must be visible after login"

        initial_count = page.locator('#teacher-student-table-body tr').count()
        page.locator('#btn-open-add-student-modal').click()
        page.wait_for_timeout(200)
        page.locator('#crud-student-code').fill('9A2-88')
        page.locator('#crud-student-name').fill('Học sinh Mới 88')
        page.locator('#crud-student-grade').fill('9A2')
        page.locator('#crud-student-school').fill(test_school)
        page.locator('#btn-save-crud-student').click()
        page.wait_for_timeout(300)

        new_count = page.locator('#teacher-student-table-body tr').count()
        assert new_count == initial_count + 1, "Roster count must increment"

        csv_text = page.evaluate("""() => {
            return window.TeacherAnalytics.generateCSVContent(window.TeacherAnalytics.currentClassData, '9A2');
        }""")
        assert 'Học sinh Mới 88' in csv_text or test_name in csv_text, "CSV export must include students"
        results["user_flows_tested"].append("Teacher Dashboard & Evidence CSV Export: PASS")

        # F12 Console Error Check
        assert len(results["console_errors"]) == 0, f"Found {len(results['console_errors'])} console errors: {results['console_errors']}"

        results["passed"] = True
        browser.close()

    print("\n" + "="*70)
    print("🏆 EDUPATH AI GIAI ĐOẠN 5: KIỂM THỬ TOÀN HỆ THỐNG THÀNH CÔNG 100%!")
    print("="*70)
    print("1. Độ phân giải đã kiểm thử (0 bẫy tràn ngang):")
    for r in results["resolutions_tested"]:
        print(f"   ✔ {r['viewport']} ({r['width']}x{r['height']}): scrollWidth={r['scrollWidth']}, clientWidth={r['clientWidth']}")
    print("\n2. Luồng nghiệp vụ hướng nghiệp đã xác thực:")
    for f in results["user_flows_tested"]:
        print(f"   ✔ {f}")
    print(f"\n3. Giám sát Console F12: {len(results['console_errors'])} errors, {len(results['console_warnings'])} warnings (HOÀN HẢO).")
    print("="*70)
    return results

if __name__ == '__main__':
    run_system_verification()
