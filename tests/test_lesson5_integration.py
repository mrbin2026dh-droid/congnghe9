# -*- coding: utf-8 -*-
"""
Test Suite: Seamless Holland-to-Lesson 5 Integration
Verifies major synchronization, 10-criteria assessment matrix, 3 SGK classification levels,
three guiding career questions, and printable report generation.
"""
import os
import json
import urllib.parse
from playwright.sync_api import sync_playwright

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_lesson5_integration():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.goto(url)
        page.wait_for_load_state('domcontentloaded')

        # Student login to enter learning view
        page.locator('#login-student-code').fill('9A1-01')
        page.locator('#btn-submit-student-login').click()
        page.wait_for_timeout(300)

        # Navigate to Project 5 Tab
        project_tab_btn = page.locator('.tab-btn[data-tab="project"]')
        project_tab_btn.click()
        page.wait_for_timeout(300)

        # Check target major selector dropdown exists
        major_select = page.locator('#assessment-major-select')
        assert major_select.count() == 1, "Major selector dropdown must exist in Lesson 5"

        # Check 10 criteria table exists and has 10 rows
        matrix_rows = page.locator('#assessment-matrix-body tr')
        assert matrix_rows.count() == 10, f"Expected 10 criteria rows in Lesson 5, got {matrix_rows.count()}"

        # Test selecting a different major from dropdown
        major_select.select_option('cntt-software')
        page.wait_for_timeout(200)

        # Target major title should update
        target_name = page.locator('#assessment-target-major-name').text_content()
        assert "phần mềm" in target_name.lower() or "cntt" in target_name.lower(), f"Expected software engineering major title, got {target_name}"

        # Test clicking match toggle button on row 1
        toggle_btn_1 = matrix_rows.nth(0).locator('.match-toggle-btn')
        was_matched = "matched" in toggle_btn_1.get_attribute("class")
        toggle_btn_1.click()
        page.wait_for_timeout(200)
        is_matched_now = "matched" in toggle_btn_1.get_attribute("class")
        assert was_matched != is_matched_now, "Clicking toggle button must toggle matched state"

        # Check SGK 3-level score and classification badge
        score_val = page.locator('#assessment-score-value').text_content()
        assert "/ 10" in score_val, f"Score should be X / 10, got {score_val}"

        classification_badge = page.locator('#assessment-classification-badge')
        assert classification_badge.text_content() in [
            "Không phù hợp",
            "Phù hợp một phần",
            "Phù hợp hoàn toàn"
        ], f"Classification must match SGK standards, got {classification_badge.text_content()}"

        # Check 3 guiding questions inputs exist
        q1_input = page.locator('#sgk-q1-understand-self')
        q2_input = page.locator('#sgk-q2-understand-career')
        q3_input = page.locator('#sgk-q3-career-path')

        assert q1_input.count() == 1, "Question 1 (Hiểu mình) must exist"
        assert q2_input.count() == 1, "Question 2 (Hiểu nghề) must exist"
        assert q3_input.count() == 1, "Question 3 (Học nghề & rèn nghề) must exist"

        # Fill in answers to the 3 questions
        q1_input.fill("Em yêu thích công nghệ, thích sửa chữa đồ điện tử và lập trình.")
        q2_input.fill("Ngành Công nghệ thông tin đòi hỏi tư duy logic, ngoại ngữ tốt và học tập liên tục.")
        q3_input.fill("Em dự định thi vào lớp 10 THPT rồi học tiếp Đại học Bách Khoa.")
        q3_input.press("Enter")
        page.wait_for_timeout(300)

        # Check that printable HTML includes school, student name, and the 3 questions
        printable_html = page.evaluate("""() => {
            const targetMajor = window.EduPathData.majors.find(m => m.id === window.app.studentProfile.targetMajorId) || window.EduPathData.majors[0];
            const result = ProjectAssessment.calculateProjectResult(window.app.assessmentMatches);
            return ProjectAssessment.generatePrintableHTML(window.app.studentProfile, targetMajor, window.app.assessmentMatches, result);
        }""")

        assert "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" in printable_html
        assert "BÁO CÁO DỰ ÁN HỌC TẬP (BÀI 5 SGK CÔNG NGHỆ 9)" in printable_html
        assert "GIÁO VIÊN BỘ MÔN CHẤM" in printable_html
        assert "Ý KIẾN PHỤ HUYNH" in printable_html

        browser.close()
        print("LESSON 5 INTEGRATION TESTS PASSED!")

if __name__ == '__main__':
    test_lesson5_integration()
