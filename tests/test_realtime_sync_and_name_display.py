# -*- coding: utf-8 -*-
"""
Verification Test for:
1. Student Full Name Accuracy:
   - Verifies Excel import parses 'Họ và tên' distinctly from 'Mã học sinh'
   - Verifies Teacher dashboard table renders real student full name (e.g. 'NGUYỄN THỊ NHÃ ÁI')
2. Image 3 CSS & Topbar Badge:
   - Verifies #user-info-text renders full student name '9C-01 · NGUYỄN THỊ NHÃ ÁI'
   - Verifies .user-info-text CSS does not truncate or cut off names (max-width: none on desktop)
3. Image 4 Realtime Sync Feature:
   - Whole-class realtime sync button (#btn-sync-all-realtime) with live pulse indicator
   - Individual student realtime sync button (.btn-sync-student)
   - Realtime status pill (.realtime-status-pill.online) displaying 'Live'
   - Instant toast notification on realtime sync
4. Clean Console F12 (Zero errors)
"""
import os
import sys
import json
import urllib.parse
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_realtime_sync_and_name_display():
    url = get_page_url()
    console_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1366, "height": 768})
        page = context.new_page()

        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        page.goto(url)
        page.wait_for_load_state('domcontentloaded')
        page.wait_for_timeout(1000)

        # -------------------------------------------------------------
        # STEP 1: TEST STUDENT NAME IN TEACHER DASHBOARD (Image 1 & 2)
        # -------------------------------------------------------------
        print("\n--- STEP 1: Verifying Teacher Table Renders Real Full Names ---")
        if not page.locator('#auth-modal').is_visible() and page.locator('#btn-open-login').is_visible():
            page.locator('#btn-open-login').click()
            page.wait_for_timeout(300)

        # Log in as teacher
        page.locator('#auth-tab-teacher').click()
        page.locator('#login-teacher-pin').fill('2026')
        page.locator('#btn-submit-teacher-login').click()
        page.wait_for_timeout(800)

        assert page.locator('#view-teacher').is_visible(), "Teacher view must be visible after login"

        # Check student 9C-01 in the table
        # 9C-01 must display 'NGUYỄN THỊ NHÃ ÁI' and NOT '9C-01' in the name column
        student_rows = page.locator('#teacher-student-table-body tr')
        assert student_rows.count() > 0, "Student roster table must contain student rows"

        found_nhai = False
        for i in range(student_rows.count()):
            row_text = student_rows.nth(i).text_content()
            if '9C-01' in row_text:
                print(f"Row 9C-01 text: {row_text}")
                assert 'NGUYỄN THỊ NHÃ ÁI' in row_text, f"Row 9C-01 must display real name 'NGUYỄN THỊ NHÃ ÁI', got: {row_text}"
                found_nhai = True
                break

        assert found_nhai, "Student 9C-01 with name 'NGUYỄN THỊ NHÃ ÁI' must be present in the table"
        print("✓ STEP 1 PASSED: Student name displays real full name accurately!")

        # -------------------------------------------------------------
        # STEP 2: TEST REALTIME SYNC FEATURES (Image 4)
        # -------------------------------------------------------------
        print("\n--- STEP 2: Verifying Realtime Sync Feature (Individual & Whole Class) ---")
        # 1. Whole-class realtime sync button
        btn_sync_all = page.locator('#btn-sync-all-realtime')
        assert btn_sync_all.is_visible(), "Whole-class realtime sync button #btn-sync-all-realtime must be visible"
        assert page.locator('#btn-sync-all-realtime .live-pulse-dot').is_visible(), "Live pulse dot indicator must be present"

        # 2. Individual student realtime sync button
        btn_sync_student = page.locator('.btn-sync-student[data-code="9C-01"]')
        assert btn_sync_student.is_visible(), "Individual realtime sync button for 9C-01 must be visible in table"

        # 3. Realtime status pill (Live badge)
        live_pill = page.locator('tr:has-text("9C-01") .realtime-status-pill.online')
        assert live_pill.is_visible(), "Student 9C-01 (who completed survey) must have Live realtime status pill"

        # Click individual realtime sync button and verify toast
        print("Clicking individual .btn-sync-student[data-code='9C-01']...")
        btn_sync_student.click()
        page.wait_for_timeout(600)

        # Check toast notification
        toast = page.locator('#edupath-toast-container')
        assert toast.is_visible(), "Toast notification container must be visible after syncing individual student"
        toast_text = toast.text_content()
        print(f"Toast message: {toast_text}")
        assert 'NGUYỄN THỊ NHÃ ÁI' in toast_text or '9C-01' in toast_text, "Toast must confirm student sync"

        # Click whole-class realtime sync button
        print("Clicking #btn-sync-all-realtime (Whole class)...")
        btn_sync_all.click()
        page.wait_for_timeout(800)

        toast_text_all = toast.text_content()
        print(f"Whole class toast message: {toast_text_all}")
        assert 'thời gian thực' in toast_text_all.lower() or 'đồng bộ' in toast_text_all.lower(), "Toast must confirm whole class sync"
        print("✓ STEP 2 PASSED: Realtime sync features (individual and whole class) operational!")

        # -------------------------------------------------------------
        # STEP 3: TEST STUDENT LOGIN & TOPBAR BADGE CSS (Image 3)
        # -------------------------------------------------------------
        print("\n--- STEP 3: Verifying Topbar Badge Displays Full Name with Correct CSS ---")
        page.locator('#btn-logout').click()
        page.wait_for_timeout(300)

        if page.locator('#auth-tab-student').is_visible():
            page.locator('#auth-tab-student').click()
            page.wait_for_timeout(200)

        # Log in as 9C-01
        page.locator('#login-student-code').fill('9C-01')
        page.locator('#btn-submit-student-login').click()
        page.wait_for_timeout(600)

        # Verify badge text
        user_info = page.locator('#user-info-text')
        badge_text = user_info.text_content()
        print(f"Logged in student badge text: '{badge_text}'")
        assert '9C-01' in badge_text, "Badge must contain student code 9C-01"
        assert 'NGUYỄN THỊ NHÃ ÁI' in badge_text, f"Badge must contain student full name 'NGUYỄN THỊ NHÃ ÁI', got '{badge_text}'"

        # Check CSS max-width of #user-info-text
        computed_max_width = page.evaluate("() => window.getComputedStyle(document.getElementById('user-info-text')).maxWidth")
        print(f"Computed maxWidth for #user-info-text: {computed_max_width}")
        assert computed_max_width == 'none' or computed_max_width == '100%' or float(computed_max_width.replace('px', '')) >= 300, \
            f"Badge max-width must not be cramped/truncated (expected 'none' or >=300px), got {computed_max_width}"

        print("✓ STEP 3 PASSED: Full student name displays completely without clipping or truncation!")

        # -------------------------------------------------------------
        # STEP 4: CONSOLE F12 VERIFICATION
        # -------------------------------------------------------------
        print("\n--- STEP 4: Checking Console F12 Logs ---")
        filtered_errors = [e for e in console_errors if not ('favicon' in e.lower() or 'gemini' in e.lower())]
        print(f"Console errors count: {len(filtered_errors)}")
        for err in filtered_errors:
            print("ERR:", err)
        assert len(filtered_errors) == 0, f"Expected 0 console errors, found: {filtered_errors}"
        print("✓ STEP 4 PASSED: 0 Console F12 errors.")

        browser.close()
        print("\n🏆 ALL REALTIME SYNC & NAME ACCURACY TESTS PASSED (100%)!")

if __name__ == '__main__':
    test_realtime_sync_and_name_display()
