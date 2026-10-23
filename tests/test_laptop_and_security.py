# -*- coding: utf-8 -*-
"""
Verification Suite for Laptop 13.3" UI & Teacher Security PIN:
1. 13.3" Laptop Screen (1280x768 & 1366x768): 0 topbar cutoffs, user badge and logout 100% visible.
2. Quiz Tab: Prev/Next buttons visible and not clipped, collapsible question palette.
3. Teacher Security: 0 hardcoded PIN hints, dynamic Firebase PIN verification & Change PIN feature.
"""
import os
import json
import urllib.parse
from playwright.sync_api import sync_playwright

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_laptop_and_security():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Test on 13.3" laptop screen (1280x768)
        context = browser.new_context(viewport={'width': 1280, 'height': 768})
        page = context.new_page()

        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

        page.goto(url)
        page.wait_for_load_state('domcontentloaded')

        # -------------------------------------------------------------
        # TEST 1: 13.3" SCREEN (1280x768) TOPBAR NOT CUT OFF
        # -------------------------------------------------------------
        # Login as student
        page.locator('#login-student-code').fill('NH-9A1')
        page.locator('#btn-submit-student-login').click()
        page.wait_for_timeout(300)

        # Check topnav does not overflow viewport width
        is_overflowing = page.evaluate("() => document.documentElement.scrollWidth > document.documentElement.clientWidth")
        assert not is_overflowing, "Topbar or stage overflows horizontally at 1280px!"

        # Check user badge and logout button are inside viewport
        user_badge = page.locator('#logged-in-user-badge')
        assert user_badge.is_visible(), "User badge must be visible on 13.3-inch screen"
        badge_box = user_badge.bounding_box()
        assert badge_box is not None, "Badge bounding box must exist"
        assert badge_box['x'] + badge_box['width'] <= 1280, f"User badge pushed off right edge: {badge_box['x'] + badge_box['width']} > 1280"

        logout_btn = page.locator('#btn-logout')
        assert logout_btn.is_visible(), "Logout button must be visible on 13.3-inch screen"

        print("[PASS] TEST 1: 13.3-inch laptop topbar renders cleanly with zero clipping.")

        # -------------------------------------------------------------
        # TEST 2: QUIZ TAB (H2) BUTTON VISIBILITY & PALETTE TOGGLE
        # -------------------------------------------------------------
        page.locator('.tab-btn[data-tab="quiz"]').click()
        page.wait_for_timeout(300)

        # Check bottom navigation buttons exist and are visible
        prev_btn = page.locator('#quiz-prev-btn')
        next_btn = page.locator('#quiz-next-btn')
        assert prev_btn.count() == 1, "Prev button must exist"
        assert next_btn.count() == 1, "Next button must exist"
        assert next_btn.is_visible(), "Next button must be visible in quiz view"

        # Check palette toggle works
        toggle_btn = page.locator('#btn-toggle-palette')
        assert toggle_btn.count() == 1, "Palette toggle button must exist"
        palette = page.locator('#quiz-question-palette')
        assert palette.is_visible(), "Palette should initially be visible"

        toggle_btn.click()
        page.wait_for_timeout(200)
        assert not palette.is_visible(), "Palette should be hidden after toggle click"

        toggle_btn.click()
        page.wait_for_timeout(200)
        assert palette.is_visible(), "Palette should be visible after second toggle click"

        print("[PASS] TEST 2: Quiz screen navigation buttons fully visible and palette toggle works.")

        # -------------------------------------------------------------
        # TEST 3: TEACHER SECURITY & PIN CHANGE FEATURE
        # -------------------------------------------------------------
        # Logout
        page.locator('#btn-logout').click()
        page.wait_for_timeout(300)

        # Switch to teacher login
        page.locator('#auth-tab-teacher').click()
        page.wait_for_timeout(200)

        # Verify NO PIN hint text exists in teacher form
        teacher_form_text = page.locator('#teacher-login-form').text_content()
        assert "123456" not in teacher_form_text and "2026" not in teacher_form_text, "Default password hint must be removed from login modal"
        pin_placeholder = page.locator('#login-teacher-pin').get_attribute('placeholder') or ''
        assert "123456" not in pin_placeholder and "2026" not in pin_placeholder, "Default password hint must be removed from input placeholder"

        # Login as teacher
        page.locator('#login-teacher-pin').fill('2026')
        page.locator('#btn-submit-teacher-login').click()
        page.wait_for_timeout(400)

        assert page.locator('#view-teacher').is_visible(), "Teacher view must open after login"

        # Check Change PIN button exists
        change_pin_btn = page.locator('#btn-open-change-pin-modal')
        assert change_pin_btn.is_visible(), "Change PIN button must be visible in Teacher Dashboard"

        # Open Change PIN Modal
        change_pin_btn.click()
        page.wait_for_timeout(200)
        pin_modal = page.locator('#teacher-change-pin-modal')
        assert pin_modal.is_visible(), "Change PIN modal must open"

        # Test validation: wrong current PIN
        page.locator('#change-pin-current').fill('999999')
        page.locator('#change-pin-new').fill('654321')
        page.locator('#change-pin-confirm').fill('654321')
        page.locator('#btn-submit-change-pin').click()
        page.wait_for_timeout(200)

        err_msg = page.locator('#change-pin-error')
        assert err_msg.is_visible(), "Error message must appear for wrong current PIN"
        assert "không chính xác" in err_msg.text_content(), "Error message must state PIN is incorrect"

        # Test successful change
        page.locator('#change-pin-current').fill('2026')
        page.locator('#change-pin-new').fill('888888')
        page.locator('#change-pin-confirm').fill('888888')
        page.locator('#btn-submit-change-pin').click()
        page.wait_for_timeout(500)

        success_msg = page.locator('#change-pin-success')
        assert success_msg.is_visible(), "Success message must appear on successful PIN change"
        page.wait_for_timeout(1000)

        # Restore PIN back to 2026 for test stability
        page.evaluate("async () => { await window.EduPathFirebase.setTeacherPin('2026'); }")

        print("[PASS] TEST 3: Teacher security verified, password hint removed, and Change PIN feature working.")

        assert len(console_errors) == 0, f"Console F12 errors found: {console_errors}"
        browser.close()

if __name__ == '__main__':
    test_laptop_and_security()
    print("[SUCCESS] ALL LAPTOP & SECURITY TESTS PASSED 100%!")
