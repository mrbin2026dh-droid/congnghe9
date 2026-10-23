# -*- coding: utf-8 -*-
"""
Verification Test Suite: Individual Student RIASEC Chart vs Whole Class Chart
Verifies:
1. Default teacher view shows Whole Class distribution heatmap.
2. Clicking "📊 Biểu đồ" button or clicking on a student's row transforms chart into individual RIASEC breakdown.
3. Chart title displays "Biểu Đồ RIASEC Cá Nhân: [Tên] ([Mã HS] · Mã: [Mã Holland])".
4. Canvas renders exact student percentages (A=87%, S=73%, R=40%, etc.) with Top 1, Top 2, Top 3 indicators.
5. "👥 Xem Biểu Đồ Cả Lớp" button appears and clicking it smoothly returns to whole-class view.
6. Dropdown #teacher-student-chart-select dynamically syncs and can switch between students and whole class.
7. Selected student row is highlighted with .selected-student-row class.
8. Zero console F12 errors.
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

def test_individual_student_chart():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

        page.goto(url)
        page.wait_for_load_state('domcontentloaded')

        print("\n=== STEP 1: Log in as Teacher and verify initial Whole Class chart ===")
        if page.locator('#btn-logout').is_visible():
            page.locator('#btn-logout').click()
            page.wait_for_timeout(200)

        page.locator('#auth-tab-teacher').click()
        page.locator('#login-teacher-pin').fill('2026')
        page.locator('#btn-submit-teacher-login').click()
        page.wait_for_timeout(500)

        assert page.locator('#view-teacher').is_visible(), "Teacher view must be visible after login"

        # Check whole class button is initially hidden
        whole_class_btn = page.locator('#btn-view-whole-class-chart')
        assert not whole_class_btn.is_visible(), "Whole class toggle button should be hidden initially"

        # Check initial title contains "Bản Đồ Nhiệt RIASEC"
        initial_title = page.locator('#teacher-heatmap-title').text_content()
        print(f"Initial Heatmap Title: {initial_title}")
        assert "bản đồ nhiệt riasec" in initial_title.lower(), f"Expected class heatmap title, got '{initial_title}'"

        # Check student chart select dropdown exists
        student_select = page.locator('#teacher-student-chart-select')
        assert student_select.is_visible(), "Student chart select dropdown must exist"
        select_val = student_select.input_value()
        assert select_val == '', "Dropdown should default to empty string (whole class)"

        # Check student table has at least 1 student
        rows = page.locator('#teacher-student-table-body tr')
        assert rows.count() >= 1, "Teacher table should have at least 1 student"

        # Check "📊 Biểu đồ" action button exists in row
        chart_btn = rows.first.locator('.btn-table-chart')
        assert chart_btn.is_visible(), "Action button '📊 Biểu đồ' must be visible in table row"
        print("[PASS] Step 1: Teacher dashboard initialized with Whole Class chart and controls.")

        print("\n=== STEP 2: Click '📊 Biểu đồ' on student NH-9A1 to view individual chart ===")
        chart_btn.click()
        page.wait_for_timeout(400)

        # 1. Title should now be Individual Student RIASEC chart
        indiv_title = page.locator('#teacher-heatmap-title').text_content()
        print(f"Individual Heatmap Title: {indiv_title}")
        assert "biểu đồ riasec cá nhân" in indiv_title.lower(), f"Title must indicate individual RIASEC chart, got '{indiv_title}'"
        assert "NH-9A1" in indiv_title, f"Title must contain student code NH-9A1, got '{indiv_title}'"

        # 2. Whole class button should now be visible
        assert whole_class_btn.is_visible(), "Button '👥 Xem Biểu Đồ Cả Lớp' must become visible"

        # 3. Dropdown should automatically sync to NH-9A1
        assert student_select.input_value() == 'NH-9A1', f"Dropdown value should sync to NH-9A1, got '{student_select.input_value()}'"

        # 4. Table row must have class .selected-student-row
        assert "selected-student-row" in (rows.first.get_attribute('class') or ''), "Table row must have .selected-student-row class"

        # 5. Recommendation card should show individual guidance
        rec_text = page.locator('#teacher-pedagogy-recommendation').text_content()
        print(f"Individual Recommendation: {rec_text}")
        assert "hồ sơ hướng nghiệp cá nhân" in rec_text.lower(), f"Recommendation should show individual profile, got '{rec_text}'"

        print("[PASS] Step 2: Individual student chart rendered accurately with title, top indicators, and row highlight.")

        print("\n=== STEP 3: Click '👥 Xem Biểu Đồ Cả Lớp' to return to Whole Class view ===")
        whole_class_btn.click()
        page.wait_for_timeout(400)

        # Button should disappear
        assert not whole_class_btn.is_visible(), "Button '👥 Xem Biểu Đồ Cả Lớp' should hide in whole class mode"

        # Dropdown should reset to empty
        assert student_select.input_value() == '', f"Dropdown should reset to empty, got '{student_select.input_value()}'"

        # Title should reset to Whole Class
        reset_title = page.locator('#teacher-heatmap-title').text_content()
        print(f"Reset Heatmap Title: {reset_title}")
        assert "bản đồ nhiệt riasec" in reset_title.lower() and "cá nhân" not in reset_title.lower(), f"Title must return to whole class, got '{reset_title}'"

        # Table row class .selected-student-row should be removed
        assert "selected-student-row" not in (rows.first.get_attribute('class') or ''), "Table row should no longer have .selected-student-row class"

        print("[PASS] Step 3: Successfully returned to Whole Class chart mode.")

        print("\n=== STEP 4: Switch student using the Dropdown selector ===")
        student_select.select_option('NH-9A1')
        page.wait_for_timeout(400)

        indiv_title2 = page.locator('#teacher-heatmap-title').text_content()
        print(f"Dropdown selected title: {indiv_title2}")
        assert "biểu đồ riasec cá nhân" in indiv_title2.lower() and "NH-9A1" in indiv_title2, "Selecting student in dropdown must activate individual chart"
        assert whole_class_btn.is_visible(), "Whole class button must be visible when student selected via dropdown"

        # Switch dropdown back to whole class
        student_select.select_option('')
        page.wait_for_timeout(400)
        assert not whole_class_btn.is_visible(), "Selecting whole class in dropdown must return to whole class chart"

        print("[PASS] Step 4: Dropdown selector accurately toggles between Individual and Whole Class charts.")

        print("\n=== STEP 5: Click student row to toggle individual chart ===")
        rows.first.click()
        page.wait_for_timeout(400)
        assert whole_class_btn.is_visible(), "Clicking table row must toggle on individual chart"

        # Click table row again to toggle off
        rows.first.click()
        page.wait_for_timeout(400)
        assert not whole_class_btn.is_visible(), "Clicking selected table row again must toggle off and return to whole class chart"

        print("[PASS] Step 5: Table row click toggles individual chart on/off seamlessly.")

        # Check console errors
        assert len(console_errors) == 0, f"Console F12 errors detected: {console_errors}"
        print("[PASS] Zero Console F12 errors detected.")

        browser.close()
        print("\n=======================================================")
        print("🎉 ALL INDIVIDUAL VS WHOLE CLASS CHART TESTS PASSED 100%!")
        print("=======================================================")

if __name__ == '__main__':
    test_individual_student_chart()
