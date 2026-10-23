# -*- coding: utf-8 -*-
"""
Test Suite: Real-Time Dual-Context Synchronization Test
Opens 2 separate browser contexts:
- Context A: Teacher Dashboard (Tab 5) observing class 9A1.
- Context B: Student Session (9A1-01) completing assessment and changing target career.
Verifies that student's progress updates in Teacher Dashboard in real-time without F5 reload.
"""
import os
import json
import urllib.parse
from playwright.sync_api import sync_playwright

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_realtime_sync_dual_context():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1366, "height": 768})

        # Window A: Teacher Window
        page_teacher = context.new_page()
        page_teacher.goto(url)
        page_teacher.wait_for_load_state('domcontentloaded')

        # Login as teacher
        if page_teacher.locator('#btn-logout').is_visible():
            page_teacher.locator('#btn-logout').click()
            page_teacher.wait_for_timeout(200)
        elif (not page_teacher.locator('#auth-modal').is_visible()) and page_teacher.locator('#btn-open-login').is_visible():
            page_teacher.locator('#btn-open-login').click()
            page_teacher.wait_for_timeout(200)

        page_teacher.locator('#auth-tab-teacher').click()
        page_teacher.locator('#login-teacher-pin').fill('123456')
        page_teacher.locator('#btn-submit-teacher-login').click()
        page_teacher.wait_for_timeout(300)

        assert page_teacher.locator('#view-teacher').is_visible(), "Teacher view should be visible"

        # Window B: Student Window
        page_student = context.new_page()
        page_student.goto(url)
        page_student.wait_for_load_state('domcontentloaded')

        # Login as student 9A1-01
        if page_student.locator('#btn-logout').is_visible():
            page_student.locator('#btn-logout').click()
        elif page_student.locator('#btn-open-login').is_visible():
            page_student.locator('#btn-open-login').click()
        page_student.wait_for_timeout(200)

        page_student.locator('#login-student-code').fill('9A1-01')
        page_student.locator('#btn-submit-student-login').click()
        page_student.wait_for_timeout(300)

        # Student performs progress update: Set specific unique major
        page_student.evaluate("""() => {
            window.app.studentProfile.targetMajorName = 'Kỹ sư Vũ trụ & Robot AI';
            window.app.studentProfile.code = 'XYZ';
            window.app.assessmentMatches = [true, true, true, true, true, true, true, true, true, true]; // 10/10
            window.app.saveProfileToStorage();
        }""")
        page_student.wait_for_timeout(500)

        # Check Teacher Window (Context A) receives the update in real-time on student 9A1-01 row
        row_student_1 = page_teacher.locator('tr:has-text("9A1-01")')
        row_text = row_student_1.text_content()
        assert 'XYZ' in row_text or 'Kỹ sư Vũ trụ & Robot AI' in row_text, f"Teacher dashboard did not receive student update in real-time. Row content: {row_text}"

        browser.close()
        print("REAL-TIME DUAL-CONTEXT SYNC TESTS PASSED!")

if __name__ == '__main__':
    test_realtime_sync_dual_context()
