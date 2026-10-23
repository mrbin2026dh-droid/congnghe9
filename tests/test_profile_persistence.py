# -*- coding: utf-8 -*-
"""
Test Suite: Student Profile & Session Persistence Engine
Verifies that student accounts (Mã học sinh, Trường, Lớp, Tên) persist across sessions,
reload properly, and update the session UI correctly.
"""
import os
import json
import urllib.parse
from playwright.sync_api import sync_playwright

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_student_profile_persistence():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Step 1: Open the application
        page.goto(url)
        page.wait_for_load_state('domcontentloaded')

        # Open login modal
        if page.locator('#btn-logout').is_visible():
            page.locator('#btn-logout').click()
        elif page.locator('#btn-open-login').is_visible():
            page.locator('#btn-open-login').click()
        page.wait_for_timeout(200)

        # Step 2: Fill in student code 9A2-04 (Phạm Đức Dũng)
        student_code_in = page.locator('#login-student-code')
        student_code_in.fill('9A2-04')
        page.locator('#btn-submit-student-login').click()
        page.wait_for_timeout(300)

        # Check badge updates with student code and name
        user_info = page.locator('#user-info-text').text_content()
        assert '9A2-04' in user_info or 'Phạm Đức Dũng' in user_info, f"Badge does not match: {user_info}"

        # Check that localStorage contains the saved profile
        saved_user_raw = page.evaluate("() => localStorage.getItem('edupath_current_user')")
        assert saved_user_raw is not None, "User session must be saved in localStorage"
        saved_user = json.loads(saved_user_raw)
        assert saved_user.get('code') == '9A2-04'

        saved_profile_raw = page.evaluate("() => localStorage.getItem('edupath_student_profile')")
        assert saved_profile_raw is not None, "Profile must be saved in localStorage"
        saved_profile = json.loads(saved_profile_raw)
        assert 'Phạm Đức Dũng' in saved_profile.get('name', '')

        # Step 3: Reload page and verify data persists
        page.reload()
        page.wait_for_load_state('domcontentloaded')

        reloaded_info = page.locator('#user-info-text').text_content()
        assert '9A2-04' in reloaded_info or 'Phạm Đức Dũng' in reloaded_info, f"Reloaded badge mismatch: {reloaded_info}"

        # Step 4: Logout check
        page.locator('#btn-logout').click()
        page.wait_for_timeout(200)

        assert page.locator('#auth-modal').is_visible() or page.locator('#btn-open-login').is_visible()

        browser.close()
        print("ALL PROFILE PERSISTENCE TESTS PASSED!")

if __name__ == '__main__':
    test_student_profile_persistence()
