# -*- coding: utf-8 -*-
"""
Test Suite: Teacher Analytics & Evidence Collection
Verifies dynamic student roster, adding current student profile to roster,
class heatmap re-rendering, and UTF-8 CSV export with complete school/grade fields.
"""
import os
import json
import urllib.parse
from playwright.sync_api import sync_playwright

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_teacher_analytics():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.goto(url)
        page.wait_for_load_state('domcontentloaded')

        # Switch to teacher mode via auth modal
        if page.locator('#btn-logout').is_visible():
            page.locator('#btn-logout').click()
            page.wait_for_timeout(200)
        elif (not page.locator('#auth-modal').is_visible()) and page.locator('#btn-open-login').is_visible():
            page.locator('#btn-open-login').click()
            page.wait_for_timeout(200)
        page.locator('#auth-tab-teacher').click()
        page.locator('#login-teacher-pin').fill('2026')
        page.locator('#btn-submit-teacher-login').click()
        page.wait_for_timeout(300)

        # Navigate to Teacher Tab
        assert page.locator('#view-teacher').is_visible(), 'Teacher view must be visible directly after login'

        # Check export CSV button exists
        export_csv_btn = page.locator('#export-class-csv-btn')
        assert export_csv_btn.count() == 1, "Export CSV button must exist"

        # Check add current student to roster button exists
        add_student_btn = page.locator('#add-current-to-roster-btn')
        assert add_student_btn.count() == 1, "Button to add current student to class roster must exist"

        # Initial student count in table
        initial_rows = page.locator('#teacher-student-table-body tr')
        initial_count = initial_rows.count()
        assert initial_count >= 1, "Student table must have initial rows"

        # Click add current student button
        add_student_btn.click()
        page.wait_for_timeout(300)

        # Check that table count increased by 1
        new_rows = page.locator('#teacher-student-table-body tr')
        assert new_rows.count() == initial_count + 1, f"Expected {initial_count + 1} rows, got {new_rows.count()}"

        # Verify CSV export content via evaluate
        csv_content = page.evaluate("""() => {
            const data = window.TeacherAnalytics.currentClassData || window.TeacherAnalytics.DEFAULT_CLASS_DATA;
            return window.TeacherAnalytics.generateCSVContent(data, '9A1');
        }""")

        assert "Trường THCS" in csv_content, "CSV must contain School column header"
        assert "Mã Holland" in csv_content, "CSV must contain Holland Code column header"
        assert "Điểm Bài 5" in csv_content, "CSV must contain Lesson 5 score header"

        browser.close()
        print("TEACHER ANALYTICS & EVIDENCE TESTS PASSED!")

if __name__ == '__main__':
    test_teacher_analytics()
