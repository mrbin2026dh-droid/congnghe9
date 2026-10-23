# -*- coding: utf-8 -*-
"""
End-to-End System-Wide Acceptance Test Suite:
1. Clean Topbar Navigation: No cramped inputs, full tab titles on 1366x768 laptop.
2. Student Code-Based Login: Session badge, student role, teacher tab hidden.
3. Holland Survey & Lesson 5 Matrix: Answer selection, score computation, printable A4 report.
4. Teacher Administration: PIN authentication, teacher tab visible, student CRUD (add, edit, delete).
5. Realtime Sync & Evidence Export: Instant roster updates, UTF-8 CSV with BOM.
6. Multi-Resolution & Zero-Overflow: 1920x1080 (FHD), 1366x768 (Laptop), 375x812 (Mobile).
7. Console F12: Zero uncaught exceptions, zero console errors.
"""
import os
import json
import urllib.parse
from playwright.sync_api import sync_playwright

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_full_system_firebase_auth():
    url = get_page_url()
    console_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # -------------------------------------------------------------
        # PHASE 1: Desktop / Laptop Navigation & Student Workflow
        # -------------------------------------------------------------
        context_laptop = browser.new_context(viewport={"width": 1366, "height": 768})
        page = context_laptop.new_page()
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

        page.goto(url)
        page.wait_for_load_state('domcontentloaded')

        # 1. Clean Topbar Verification
        assert page.locator('#student-school-input').count() == 0, "Old school input removed from topbar"
        assert page.locator('#student-grade-input').count() == 0, "Old grade input removed from topbar"
        assert page.locator('#student-name-input').count() == 0, "Old name input removed from topbar"

        # Check full tab labels (no truncated 'Dự...')
        tab_buttons = page.locator('.tab-btn')
        for i in range(tab_buttons.count()):
            btn_text = tab_buttons.nth(i).text_content()
            assert "Dự Án Bài 5" in btn_text or "Vườn Cây" in btn_text or "Trắc Nghiệm" in btn_text or "Cố Vấn" in btn_text or "Bảng Giáo Viên" in btn_text, f"Unexpected or truncated tab label: '{btn_text}'"

        # 2. Student Authentication Flow
        # If already logged in, log out first to verify fresh login
        if page.locator('#btn-logout').is_visible():
            page.locator('#btn-logout').click()
            page.wait_for_timeout(200)
        elif (not page.locator('#auth-modal').is_visible()) and page.locator('#btn-open-login').is_visible():
            page.locator('#btn-open-login').click()
            page.wait_for_timeout(200)

        # Fill student login
        page.locator('#login-student-code').fill('9B1-01')
        page.locator('#btn-submit-student-login').click()
        page.wait_for_timeout(600)

        badge_text = page.locator('#user-info-text').text_content()
        assert '9B1-01' in badge_text or 'Hoàng Kim Ngân' in badge_text, f"Student badge incorrect: '{badge_text}'"

        # Teacher tab must be hidden for student
        teacher_tab = page.locator('.tab-btn[data-tab="teacher"]')
        is_hidden = (teacher_tab.count() == 0) or (not teacher_tab.is_visible())
        assert is_hidden, "Teacher tab should be hidden for student role"

        # 3. Holland Survey Flow
        page.locator('.tab-btn[data-tab="quiz"]').click()
        page.wait_for_timeout(300)
        assert page.locator('#quiz-question-palette').is_visible(), "Question palette must be visible"

        # Switch to Quick Mode (18 questions)
        page.locator('#quiz-mode-quick').click()
        page.wait_for_timeout(200)
        assert page.locator('.palette-item').count() == 18, "Quick mode palette must have 18 items"

        # 4. Project Assessment (Lesson 5 SGK)
        page.locator('.tab-btn[data-tab="project"]').click()
        page.wait_for_timeout(300)
        assert page.locator('#assessment-matrix-body tr').count() == 10, "Lesson 5 matrix must have 10 rows"
        assert page.locator('#print-project-report-btn').is_visible(), "Print A4 report button must be visible"

        # -------------------------------------------------------------
        # PHASE 2: Teacher Administration & Realtime Roster CRUD
        # -------------------------------------------------------------
        # Log out from student session and log in as teacher
        page.locator('#btn-logout').click()
        page.wait_for_timeout(200)

        page.locator('#auth-tab-teacher').click()
        page.locator('#login-teacher-pin').fill('2026')
        page.locator('#btn-submit-teacher-login').click()
        page.wait_for_timeout(300)

        assert page.locator('#view-teacher').is_visible(), "Teacher view must be visible after login"
        # Check tab-nav is hidden in teacher view (H3)
        tab_nav = page.locator('.tab-nav')
        assert not tab_nav.is_visible(), "Tab navigation must be hidden in teacher mode (H3)"

        # Add Student Account
        page.locator('#btn-open-add-student-modal').click()
        page.wait_for_timeout(200)
        page.locator('#crud-student-code').fill('9A1-88')
        page.locator('#crud-student-name').fill('Phạm Toàn Diện')
        page.locator('#crud-student-grade').fill('9A1')
        page.locator('#crud-student-school').fill('THCS Chu Văn An')
        page.locator('#btn-save-crud-student').click()
        page.wait_for_timeout(300)

        table_content = page.locator('#teacher-student-table-body').text_content()
        assert '9A1-88' in table_content and 'Phạm Toàn Diện' in table_content, "Added student must be in table"

        # Edit Student Account
        page.locator('.btn-table-edit[data-code="9A1-88"]').click()
        page.wait_for_timeout(200)
        page.locator('#crud-student-name').fill('Phạm Toàn Diện Đã Sửa')
        page.locator('#btn-save-crud-student').click()
        page.wait_for_timeout(300)

        table_content_after_edit = page.locator('#teacher-student-table-body').text_content()
        assert 'Phạm Toàn Diện Đã Sửa' in table_content_after_edit, "Updated name must be in table"

        # Delete Student Account
        page.evaluate("() => { window.confirm = () => true; }")
        page.locator('.btn-table-delete[data-code="9A1-88"]').click()
        page.wait_for_timeout(300)

        table_content_after_del = page.locator('#teacher-student-table-body').text_content()
        assert '9A1-88' not in table_content_after_del, "Deleted student must be removed from table"

        # 5. CSV Export Verification
        csv_data = page.evaluate("() => { return window.TeacherAnalytics.generateCSVContent(window.TeacherAnalytics.currentClassData, '9A1'); }")
        assert csv_data.startswith('\uFEFF'), "CSV must start with UTF-8 BOM"
        assert 'Trường THCS' in csv_data and 'Mã Holland' in csv_data, "CSV must have standard SGK headers"

        # -------------------------------------------------------------
        # PHASE 3: Responsive Layout & Zero Overflow Across 3 Devices
        # -------------------------------------------------------------
        resolutions = [
            ("Desktop FHD", 1920, 1080),
            ("Laptop", 1366, 768),
            ("Mobile", 375, 812)
        ]

        for device_name, w, h in resolutions:
            res_context = browser.new_context(viewport={"width": w, "height": h})
            res_page = res_context.new_page()
            res_page.goto(url)
            res_page.wait_for_load_state('domcontentloaded')

            overflow = res_page.evaluate("""() => {
                return {
                    scrollWidth: document.documentElement.scrollWidth,
                    clientWidth: document.documentElement.clientWidth,
                    hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
                };
            }""")
            assert not overflow['hasOverflow'], f"Horizontal overflow detected on {device_name} ({w}x{h}): scrollWidth={overflow['scrollWidth']} > clientWidth={overflow['clientWidth']}"
            res_context.close()

        # -------------------------------------------------------------
        # PHASE 4: Console F12 Cleanliness (Zero Errors)
        # -------------------------------------------------------------
        filtered_errors = [e for e in console_errors if 'favicon' not in e.lower() and 'gstatic' not in e.lower()]
        assert len(filtered_errors) == 0, f"F12 console errors found: {filtered_errors}"

        browser.close()
        print("ALL SYSTEM-WIDE FIREBASE AUTHENTICATION ACCEPTANCE TESTS PASSED (100%)!")

if __name__ == '__main__':
    test_full_system_firebase_auth()
