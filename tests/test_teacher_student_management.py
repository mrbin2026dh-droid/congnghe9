# -*- coding: utf-8 -*-
"""
Test Suite: Teacher Student Account Management (Add, Edit, Delete, Assign Code)
Verifies:
1. Teacher can open Add Student Modal.
2. Teacher can create a new student account with student code.
3. New student is rendered into the classroom table.
4. Teacher can edit existing student's name/grade.
5. Teacher can delete a student from the class roster.
"""
import os
import json
import urllib.parse
from playwright.sync_api import sync_playwright

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_teacher_student_management():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1366, "height": 768})
        page = context.new_page()

        # Step 1: Login as teacher
        page.goto(url)
        page.wait_for_load_state('domcontentloaded')

        if page.locator('#btn-logout').is_visible():
            page.locator('#btn-logout').click()
            page.wait_for_timeout(200)
        elif (not page.locator('#auth-modal').is_visible()) and page.locator('#btn-open-login').is_visible():
            page.locator('#btn-open-login').click()
            page.wait_for_timeout(200)

        page.locator('#auth-tab-teacher').click()
        page.locator('#login-teacher-pin').fill('2026')
        page.locator('#btn-submit-teacher-login').click()
        page.wait_for_selector('#view-teacher', timeout=5000)

        # Confirm teacher tab is active
        assert page.locator('#view-teacher').is_visible(), "Teacher view should be visible"

        # Check Add Student button exists
        btn_add = page.locator('#btn-open-add-student-modal')
        assert btn_add.count() == 1, "Button to add student must exist in teacher view"

        # Step 2: Open modal and add student
        btn_add.click()
        page.wait_for_timeout(200)

        crud_modal = page.locator('#student-crud-modal')
        assert crud_modal.is_visible(), "CRUD student modal must be visible"

        page.locator('#crud-student-code').fill('9A1-15')
        page.locator('#crud-student-name').fill('Trần Văn Test')
        page.locator('#crud-student-grade').fill('9A1')
        page.locator('#crud-student-school').fill('THCS Chu Văn An')

        page.locator('#btn-save-crud-student').click()
        page.wait_for_selector('#student-crud-modal', state='hidden', timeout=5000)

        # Step 3: Check student is in table
        assert page.locator('#student-crud-modal').is_hidden(), "Modal must be closed after saving"
        table_text = page.locator('#teacher-student-table-body').text_content()
        assert '9A1-15' in table_text and 'Trần Văn Test' in table_text, "Newly added student must be in table"

        # Step 4: Edit student
        edit_btn = page.locator('.btn-table-edit[data-code="9A1-15"]')
        assert edit_btn.count() == 1, "Edit button for 9A1-15 must exist"
        edit_btn.click()
        page.wait_for_timeout(200)

        assert crud_modal.is_visible(), "CRUD modal must open on edit"
        page.locator('#crud-student-name').fill('Trần Văn Đã Sửa')
        page.locator('#btn-save-crud-student').click()
        page.wait_for_selector('#student-crud-modal', state='hidden', timeout=5000)

        table_text_after_edit = page.locator('#teacher-student-table-body').text_content()
        assert 'Trần Văn Đã Sửa' in table_text_after_edit, "Updated name must appear in table"

        # Step 5: Delete student
        # Override window.confirm to return True
        page.evaluate("() => { window.confirm = () => true; }")
        delete_btn = page.locator('.btn-table-delete[data-code="9A1-15"]')
        assert delete_btn.count() == 1, "Delete button for 9A1-15 must exist"
        delete_btn.click()
        page.wait_for_timeout(300)

        table_text_after_delete = page.locator('#teacher-student-table-body').text_content()
        assert '9A1-15' not in table_text_after_delete, "Deleted student must no longer appear in table"

        browser.close()
        print("TEACHER STUDENT MANAGEMENT TESTS PASSED!")

if __name__ == '__main__':
    test_teacher_student_management()
