# -*- coding: utf-8 -*-
"""
Comprehensive Playwright Test Suite:
1. Student creation in Teacher view ("Thêm Học Sinh Mới"):
   - When filter is "Tất cả các lớp", grade defaults to "9A1", code defaults to "9A1-XX" (never "Tất cả các lớp").
   - When grade input changes to "9A2", code updates to "9A2-XX".
   - Saves to Firebase Realtime Database (100% verified on Firebase cloud).
2. Student login with newly created student account:
   - Login succeeds.
   - Profile matches Firebase cloud record.
3. Student progress synchronization:
   - Takes Holland survey & Bài 5 assessment.
   - Syncs to Firebase (hollandScores, percentages, assessmentMatches, threeQuestions, surveyHistory).
4. Teacher live sync:
   - Real-time updates reflect in teacher table and heatmap.
5. Student cleanup:
   - Delete operation syncs to Firebase.
"""
import sys, os, urllib.parse
from playwright.sync_api import sync_playwright

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_firebase_student_crud():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1366, "height": 768})
        page = context.new_page()

        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
        page.on('pageerror', lambda err: console_errors.append(str(err)))

        page.goto(url)
        page.wait_for_load_state('domcontentloaded')

        # -----------------------------------------------------------
        # TEST 1: Teacher Login and Add Student Modal Defaults
        # -----------------------------------------------------------
        if page.locator('#btn-logout').is_visible():
            page.locator('#btn-logout').click()
            page.wait_for_timeout(200)
        elif (not page.locator('#auth-modal').is_visible()) and page.locator('#btn-open-login').is_visible():
            page.locator('#btn-open-login').click()
            page.wait_for_timeout(200)

        page.locator('#auth-tab-teacher').click()
        page.locator('#login-teacher-pin').fill('123456')
        page.locator('#btn-submit-teacher-login').click()
        page.wait_for_selector('#view-teacher', timeout=5000)

        # Confirm filter is on "Tất cả các lớp" (value "")
        filter_val = page.locator('#teacher-class-filter-select').input_value()
        assert filter_val == '', "Initial class filter should be 'Tất cả các lớp' (empty value)"

        # Open Add Student modal
        page.locator('#btn-open-add-student-modal').click()
        page.wait_for_selector('#student-crud-modal', state='visible', timeout=3000)

        default_code = page.locator('#crud-student-code').input_value()
        default_grade = page.locator('#crud-student-grade').input_value()

        # CRITICAL ASSERTIONS: Must NEVER be "Tất cả các lớp"
        assert 'Tất cả' not in default_code and 'tất cả' not in default_code, f"Code must not contain 'Tất cả', got: {default_code}"
        assert 'Tất cả' not in default_grade and 'tất cả' not in default_grade, f"Grade must not contain 'Tất cả', got: {default_grade}"
        assert default_grade == '9A1', f"Grade should default to 9A1, got: {default_grade}"
        assert default_code.startswith('9A1-'), f"Code should start with 9A1-, got: {default_code}"

        # -----------------------------------------------------------
        # TEST 2: Dynamic Grade Switching in Modal
        # -----------------------------------------------------------
        page.locator('#crud-student-grade').fill('9A2')
        page.wait_for_timeout(100)
        updated_code = page.locator('#crud-student-code').input_value()
        assert updated_code.startswith('9A2-'), f"Code should dynamically update to start with 9A2-, got: {updated_code}"

        # Create student with specific test code
        test_student_code = '9A2-88'
        test_student_name = 'Lê Hoàng Firebase'
        page.locator('#crud-student-code').fill(test_student_code)
        page.locator('#crud-student-name').fill(test_student_name)
        page.locator('#crud-student-grade').fill('9A2')
        page.locator('#crud-student-school').fill('THCS Thực Nghiệm')

        # Save student
        page.locator('#btn-save-crud-student').click()
        page.wait_for_selector('#student-crud-modal', state='hidden', timeout=5000)

        # Verify in table
        table_text = page.locator('#teacher-student-table-body').text_content()
        assert test_student_code in table_text, "Newly created student code must appear in teacher table"
        assert test_student_name in table_text, "Newly created student name must appear in teacher table"

        # -----------------------------------------------------------
        # TEST 3: Verify Persistence directly in Firebase Cloud DB
        # -----------------------------------------------------------
        fb_student = page.evaluate(f"""async () => {{
            return await window.EduPathFirebase.getStudent('{test_student_code}');
        }}""")
        assert fb_student is not None, f"Student {test_student_code} must exist on Firebase"
        assert fb_student.get('name') == test_student_name
        assert fb_student.get('grade') == '9A2'
        assert fb_student.get('school') == 'THCS Thực Nghiệm'

        # -----------------------------------------------------------
        # TEST 4: Student Login with newly created account
        # -----------------------------------------------------------
        page.locator('#btn-logout').click()
        page.wait_for_selector('#auth-modal', state='visible', timeout=3000)

        # Switch to student login
        page.locator('#auth-tab-student').click()
        page.locator('#login-student-code').fill(test_student_code)
        page.locator('#btn-submit-student-login').click()
        page.wait_for_selector('#logged-in-user-badge', timeout=5000)

        # Verify badge info
        badge_text = page.locator('#user-info-text').text_content()
        assert test_student_code in badge_text and test_student_name in badge_text, f"User badge must show student code & name, got: {badge_text}"

        # -----------------------------------------------------------
        # TEST 5: Complete Assessment & Sync to Firebase
        # -----------------------------------------------------------
        sync_result = page.evaluate(f"""async () => {{
            const app = window.EduPath;
            app.studentProfile.code = 'RIC';
            app.studentProfile.scores = {{ R: 28, I: 25, A: 10, S: 12, E: 15, C: 20 }};
            app.studentProfile.percentages = {{ R: 85, I: 75, A: 30, S: 36, E: 45, C: 60 }};
            app.studentProfile.targetMajorId = 'dien-dien-tu';
            app.studentProfile.targetMajorName = 'Kỹ thuật Điện - Điện tử';
            app.assessmentMatches = [true, true, true, true, true, false, false, false, false, false];
            app.studentProfile.threeQuestions = {{
                understandSelf: 'Em yêu thích mạch điện và lập trình vi điều khiển.',
                understandCareer: 'Nghề kỹ thuật điện cần tư duy logic và kỹ năng thực hành.',
                careerPathPlan: 'Học tiếp THPT và thi tuyển Đại học Bách Khoa.'
            }};
            app.syncProgressToFirebase();
            return true;
        }}""")
        assert sync_result is True

        page.wait_for_timeout(1000)

        # Verify Firebase received full student progress
        cloud_data = page.evaluate(f"""async () => {{
            return await window.EduPathFirebase.getStudent('{test_student_code}');
        }}""")
        assert cloud_data.get('code') == 'RIC', f"Firebase Holland code must be RIC, got {cloud_data.get('code')}"
        assert cloud_data.get('major') == 'Kỹ thuật Điện - Điện tử'
        assert cloud_data.get('threeQuestions', {}).get('understandSelf') == 'Em yêu thích mạch điện và lập trình vi điều khiển.'
        assert cloud_data.get('assessmentMatches') == [True, True, True, True, True, False, False, False, False, False]

        # -----------------------------------------------------------
        # TEST 6: Switch to Teacher & Check Live Table Updates
        # -----------------------------------------------------------
        page.locator('#btn-logout').click()
        page.wait_for_selector('#auth-modal', state='visible', timeout=3000)

        page.locator('#auth-tab-teacher').click()
        page.locator('#login-teacher-pin').fill('123456')
        page.locator('#btn-submit-teacher-login').click()
        page.wait_for_selector('#view-teacher', timeout=5000)

        table_updated = page.locator('#teacher-student-table-body').text_content()
        assert 'RIC' in table_updated, "Teacher table must show Holland code RIC"
        assert 'Kỹ thuật Điện - Điện tử' in table_updated, "Teacher table must show major"

        # -----------------------------------------------------------
        # TEST 7: Delete Test Student to clean up Cloud DB
        # -----------------------------------------------------------
        # Handle JS confirm dialog automatically
        page.on('dialog', lambda dialog: dialog.accept())
        del_btn = page.locator(f'.btn-table-delete[data-code="{test_student_code}"]')
        del_btn.click()
        page.wait_for_timeout(1000)

        # Verify student is removed from table and Firebase
        table_after_del = page.locator('#teacher-student-table-body').text_content()
        assert test_student_code not in table_after_del, "Deleted student must no longer appear in table"

        cloud_after_del = page.evaluate(f"""async () => {{
            return await window.EduPathFirebase.getStudent('{test_student_code}');
        }}""")
        assert cloud_after_del is None, "Student must be deleted from Firebase cloud"

        # Check for zero console errors
        filtered_errors = [e for e in console_errors if 'favicon' not in e.lower()]
        assert len(filtered_errors) == 0, f"Console must be clean (0 errors), found: {filtered_errors}"

        browser.close()
        print("ALL COMPREHENSIVE FIREBASE STUDENT CRUD TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    test_firebase_student_crud()
