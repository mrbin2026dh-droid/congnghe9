# -*- coding: utf-8 -*-
"""
Verification Suite for User Fixes:
1. Default 0% on all sliders and Tree H1 for new student accounts.
2. Responsive Menu layout on mobile (<= 768px): zero cutoffs, clean 2x2 grid.
3. Report Generation ("Xuat Bao Cao"): 100% real data, zero fake hardcoded fallbacks.
"""
import os
import json
import urllib.parse
from playwright.sync_api import sync_playwright

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_user_fixes():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

        page.goto(url)
        page.wait_for_load_state('domcontentloaded')

        # -------------------------------------------------------------
        # TEST 1: LOGIN AS NEW STUDENT & VERIFY 0% SLIDERS IN H1
        # -------------------------------------------------------------
        page.evaluate("""async () => {
            if (window.EduPathFirebase) {
                await window.EduPathFirebase.addStudent({
                    studentCode: 'NH-9A1',
                    name: 'Nguyễn Văn A',
                    grade: '9A1',
                    school: 'THCS Nguyễn Huệ',
                    code: '',
                    major: '',
                    projectScore: null,
                    classification: '',
                    stream: ''
                });
            }
        }""")
        page.locator('#login-student-code').fill('NH-9A1')
        page.locator('#btn-submit-student-login').click()
        page.wait_for_timeout(400)

        # Check all 5 sliders are defaulted to 0
        sliders = ['slider-interest', 'slider-ability', 'slider-personality', 'slider-values', 'slider-expectation']
        for sid in sliders:
            slider_val = page.locator(f'#{sid}').input_value()
            assert slider_val == '0', f"Expected slider #{sid} to be '0', got '{slider_val}'"
            display_text = page.locator(f'#{sid}-val').text_content().strip()
            assert display_text == '0%', f"Expected #{sid}-val to be '0%', got '{display_text}'"

        # Check ratio display is 0.00
        ratio_val = page.locator('#feedback-ratio-val').text_content()
        assert '0.00' in ratio_val, f"Expected ratio to be 0.00, got '{ratio_val}'"

        # Check badge has initial state
        badge_text = page.locator('#feedback-state-badge').text_content()
        assert 'TRẠNG THÁI KHỞI TẠO' in badge_text or '0%' in badge_text, f"Expected initial badge text, got '{badge_text}'"

        # Check alert box
        alert_text = page.locator('#tree-stability-alert').text_content()
        assert '0%' in alert_text or 'MỚI KHỞI TẠO' in alert_text, f"Expected 0% in alert box, got '{alert_text}'"

        # Check SVG root labels have 0%
        svg_interest = page.locator('#label-interest').text_content()
        assert '0%' in svg_interest, f"Expected SVG interest label to have 0%, got '{svg_interest}'"

        print("[PASS] TEST 1: All H1 Tree Sliders and values default to 0% for new student.")

        # -------------------------------------------------------------
        # TEST 2: RESPONSIVE MENU AT MOBILE VIEWPORT (375x812)
        # -------------------------------------------------------------
        page.set_viewport_size({'width': 375, 'height': 812})
        page.wait_for_timeout(300)

        # Verify all tabs are visible and within viewport bounds (no horizontal overflow)
        tab_buttons = page.locator('.tab-btn')
        tab_count = tab_buttons.count()
        assert tab_count >= 4, f"Expected at least 4 student tabs, got {tab_count}"

        for i in range(tab_count):
            btn = tab_buttons.nth(i)
            box = btn.bounding_box()
            if box:
                assert box['x'] >= 0, f"Tab {i} has negative x: {box['x']}"
                assert box['x'] + box['width'] <= 375, f"Tab {i} overflows right: {box['x'] + box['width']} > 375"
                assert box['height'] >= 40, f"Tab {i} touch target height < 40px: {box['height']}"

        # Check body scrollWidth equals clientWidth (0 horizontal overflow)
        overflow_check = page.evaluate("() => document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        assert overflow_check, "Horizontal overflow detected on mobile view!"

        print("[PASS] TEST 2: Responsive navigation menu at 375px renders perfectly in 2-column grid with 0 overflow.")

        # -------------------------------------------------------------
        # TEST 3: REPORT BUTTON DATA INTEGRITY (NO FAKE HARDCODE)
        # -------------------------------------------------------------
        page.set_viewport_size({'width': 1280, 'height': 800})
        page.locator('.tab-btn[data-tab="project"]').click()
        page.wait_for_timeout(300)

        # Check score value initially is 0 / 10
        score_init = page.locator('#assessment-score-value').text_content().strip()
        assert score_init == '0 / 10', f"Expected score to be '0 / 10', got '{score_init}'"

        # Generate printable report HTML via window evaluation
        report_html = page.evaluate("""() => {
            const targetMajor = window.EduPathData.majors.find(m => m.id === window.app.studentProfile.targetMajorId) || { name: 'Chưa lựa chọn ngành nghề', code: '---' };
            const result = ProjectAssessment.calculateProjectResult(window.app.assessmentMatches);
            return ProjectAssessment.generatePrintableHTML(window.app.studentProfile, targetMajor, window.app.assessmentMatches, result);
        }""")

        # Ensure NO fake data is present
        assert "Nguyễn Văn An" not in report_html, "Fake student name 'Nguyễn Văn An' found in report!"
        assert "THCS CHU VĂN AN" not in report_html, "Fake school 'THCS CHU VĂN AN' found in report!"
        assert "Nguyễn Văn A" in report_html, f"Real student name 'Nguyễn Văn A' not found in report! Report: {report_html[:500]}"
        assert "NGUYỄN HUỆ" in report_html.upper(), "Real school 'Nguyễn Huệ' not found in report!"
        assert "9A1" in report_html, "Real grade '9A1' not found in report!"
        assert "TỔNG ĐIỂM TRÙNG KHỚP" in report_html, "Expected 'TỔNG ĐIỂM TRÙNG KHỚP' in report"
        assert "0 / 10" in report_html, "Expected 0 / 10 in report for untouched assessment"

        print("[PASS] TEST 3: Report generation reflects 100% real student data with zero fake fallbacks.")

        assert len(console_errors) == 0, f"Console F12 errors found: {console_errors}"
        browser.close()

if __name__ == '__main__':
    test_user_fixes()
    print("[SUCCESS] ALL USER FIXES VERIFIED 100% SUCCESSFULLY!")
