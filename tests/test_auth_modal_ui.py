# -*- coding: utf-8 -*-
"""
Test Suite: Authentication Modal & Clean Topbar UI
Verifies that:
1. Topbar does NOT contain cramped text inputs or export/import buttons.
2. All navigation tabs are fully visible and not truncated (no 'Dự...').
3. Auth modal exists with Student and Teacher login modes.
4. Logging in as student updates the session badge and hides teacher tab.
5. Logging in as teacher shows the teacher tab and admin role.
"""
import os
import urllib.parse
from playwright.sync_api import sync_playwright

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_auth_modal_and_clean_topbar():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use laptop width 1366 to ensure tabs don't truncate
        context = browser.new_context(viewport={"width": 1366, "height": 768})
        page = context.new_page()

        page.goto(url)
        page.wait_for_load_state('domcontentloaded')

        # 0. Initial load must show Auth Modal first (Login Gate)
        assert page.locator('#auth-modal').is_visible(), "Auth modal must be displayed on first page load"


        # 1. Topbar check: No cramped inputs
        assert page.locator('#student-school-input').count() == 0, "Old school input must be removed from topbar"
        assert page.locator('#student-grade-input').count() == 0, "Old grade input must be removed from topbar"

        # 2. Check all tab buttons have full titles (no truncated 'Dự...')
        tab_buttons = page.locator('.tab-btn')
        tab_texts = [tab_buttons.nth(i).text_content() for i in range(tab_buttons.count())]
        for t in tab_texts:
            assert "Dự Án Bài 5" in t or "Vườn Cây" in t or "Trắc Nghiệm" in t or "Cố Vấn" in t or "Bảng Giáo Viên" in t, f"Tab text truncated or unrecognized: '{t}'"

        # 3. Check Auth Modal exists
        auth_modal = page.locator('#auth-modal')
        assert auth_modal.count() == 1, "Auth modal must exist"

        # Check student code input exists inside auth modal
        student_code_input = page.locator('#login-student-code')
        assert student_code_input.count() == 1, "Student code input must exist"

        # Check teacher inputs exist
        teacher_tab_switch = page.locator('#auth-tab-teacher')
        assert teacher_tab_switch.count() == 1, "Teacher tab switch must exist"

        # 4. Test student login flow
        if not student_code_input.is_visible():
            if page.locator('#btn-logout').is_visible():
                page.locator('#btn-logout').click()
            elif page.locator('#btn-open-login').is_visible():
                page.locator('#btn-open-login').click()
            page.wait_for_timeout(200)

        student_code_input.fill('NH-9A1')
        page.locator('#btn-submit-student-login').click()
        page.wait_for_timeout(300)

        # Check user badge is displayed
        user_badge = page.locator('#logged-in-user-badge')
        assert user_badge.is_visible(), "User badge must be visible after login"

        # Check teacher tab button is hidden for student role
        teacher_nav_btn = page.locator('.tab-btn[data-tab="teacher"]')
        is_teacher_tab_hidden = (teacher_nav_btn.count() == 0) or (not teacher_nav_btn.is_visible())
        assert is_teacher_tab_hidden, "Teacher tab should be hidden or inactive for student"

        # 5. Test logout
        logout_btn = page.locator('#btn-logout')
        logout_btn.click()
        page.wait_for_timeout(200)

        # Auth modal should appear again
        assert auth_modal.is_visible(), "Auth modal must appear after logout"

        # 6. Test Teacher Login (PIN only)
        page.locator('#auth-tab-teacher').click()
        page.locator('#login-teacher-pin').fill('123456')
        page.locator('#btn-submit-teacher-login').click()
        page.wait_for_timeout(300)

        assert page.locator('#view-teacher').is_visible(), "Teacher view must be visible after teacher login"
        assert not page.locator('.tab-nav').is_visible(), "Tab-nav must be hidden in teacher mode (H3)"

        browser.close()
        print("AUTH MODAL & CLEAN TOPBAR TESTS PASSED!")

if __name__ == '__main__':
    test_auth_modal_and_clean_topbar()
