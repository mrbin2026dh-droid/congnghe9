# -*- coding: utf-8 -*-
"""
Test Suite: Firebase Realtime Database Engine & Offline Fallback
Verifies that EduPathFirebase interface provides:
1. isConfigured() check
2. getStudent() retrieval
3. addStudent(), updateStudent(), deleteStudent() CRUD operations
4. saveStudentProgress() method
5. onClassStudentsChange() realtime listener subscription
"""
import os
import json
import urllib.parse
from playwright.sync_api import sync_playwright

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_firebase_engine():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.goto(url)
        page.wait_for_load_state('domcontentloaded')

        # Check EduPathFirebase object exists on window
        has_fb = page.evaluate("() => typeof window.EduPathFirebase !== 'undefined'")
        assert has_fb, "EduPathFirebase must be defined on window"

        # Check methods exist
        methods = page.evaluate("""() => {
            const fb = window.EduPathFirebase;
            return {
                isConfigured: typeof fb.isConfigured === 'function',
                getStudent: typeof fb.getStudent === 'function',
                saveStudentProgress: typeof fb.saveStudentProgress === 'function',
                onClassStudentsChange: typeof fb.onClassStudentsChange === 'function',
                addStudent: typeof fb.addStudent === 'function',
                updateStudent: typeof fb.updateStudent === 'function',
                deleteStudent: typeof fb.deleteStudent === 'function'
            };
        }""")
        for m, exists in methods.items():
            assert exists, f"Method {m} must exist on window.EduPathFirebase"

        # Test Add student
        add_result = page.evaluate("""async () => {
            return await window.EduPathFirebase.addStudent({
                studentCode: '9A1-99',
                name: 'Học sinh Thử nghiệm',
                grade: '9A1',
                school: 'THCS Chu Văn An',
                code: 'RIA',
                major: 'Kỹ thuật Phần mềm',
                projectScore: 9,
                classification: 'Phù hợp hoàn toàn',
                stream: 'THPT & Đại học CNTT'
            });
        }""")
        assert add_result is True, "addStudent should return True"

        # Test Get student
        student = page.evaluate("""async () => {
            return await window.EduPathFirebase.getStudent('9A1-99');
        }""")
        assert student is not None, "getStudent must return the added student"
        assert student.get('name') == 'Học sinh Thử nghiệm'

        # Test Update student
        update_result = page.evaluate("""async () => {
            return await window.EduPathFirebase.updateStudent('9A1-99', {
                name: 'Học sinh Đã Cập Nhật'
            });
        }""")
        assert update_result is True, "updateStudent should return True"

        updated_student = page.evaluate("""async () => {
            return await window.EduPathFirebase.getStudent('9A1-99');
        }""")
        assert updated_student.get('name') == 'Học sinh Đã Cập Nhật'

        # Test Delete student
        del_result = page.evaluate("""async () => {
            return await window.EduPathFirebase.deleteStudent('9A1-99');
        }""")
        assert del_result is True, "deleteStudent should return True"

        deleted_student = page.evaluate("""async () => {
            return await window.EduPathFirebase.getStudent('9A1-99');
        }""")
        assert deleted_student is None, "Deleted student should return None"

        browser.close()
        print("FIREBASE REALTIME ENGINE TESTS PASSED!")

if __name__ == '__main__':
    test_firebase_engine()
