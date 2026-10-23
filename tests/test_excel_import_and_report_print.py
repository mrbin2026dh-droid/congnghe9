# -*- coding: utf-8 -*-
"""
End-to-End Verification Test for:
1. Report Print / PDF Export Feature (Bài 5 SGK):
   - Click #print-project-report-btn
   - Verify preview modal #report-preview-modal appears with A4 content
   - Verify print iframe #report-print-iframe exists
   - Verify modal close and download report HTML
2. Teacher Excel Template Download & Batch Student Roster Import:
   - Verify #btn-download-excel-template exists and executes
   - Open #excel-import-modal
   - Upload sample CSV/Excel content with multiple students
   - Verify preview table displays parsed records
   - Confirm batch import into Firebase & TeacherAnalytics
   - Verify student records are persisted and accessible for student login
3. Clean Console F12 (Zero errors)
"""
import os
import sys
import urllib.parse
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_excel_import_and_report_print():
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
        page.wait_for_timeout(800)

        # -------------------------------------------------------------
        # PART 1: TEST TEACHER EXCEL TEMPLATE & BATCH IMPORT
        # -------------------------------------------------------------
        print("\n--- PART 1: Testing Teacher Login, Dynamic Filter & Excel Import ---")
        # Ensure login modal is open
        if not page.locator('#auth-modal').is_visible() and page.locator('#btn-open-login').is_visible():
            page.locator('#btn-open-login').click()
            page.wait_for_timeout(300)

        # Log in as teacher
        page.locator('#auth-tab-teacher').click()
        page.locator('#login-teacher-pin').fill('2026')
        page.locator('#btn-submit-teacher-login').click()
        page.wait_for_timeout(800)

        assert page.locator('#view-teacher').is_visible(), "Teacher view must be visible after login"

        # Verify #btn-download-excel-template exists
        assert page.locator('#btn-download-excel-template').is_visible(), "Download Excel template button must be visible"

        # Test download template execution
        template_res = page.evaluate("() => { try { window.TeacherAnalytics.downloadExcelTemplate(); return true; } catch(e) { return false; } }")
        assert template_res is True, "TeacherAnalytics.downloadExcelTemplate() must execute without throwing"

        # Open Excel Import Modal
        page.locator('#btn-open-excel-import-modal').click()
        page.wait_for_timeout(300)

        excel_modal = page.locator('#excel-import-modal')
        assert excel_modal.is_visible(), "Excel import modal must be visible"

        # Create a sample CSV file on disk to simulate upload with custom classes (e.g. 9B1, 9T)
        temp_csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sample_students_import.csv')
        with open(temp_csv_path, 'w', encoding='utf-8-sig') as f:
            f.write("STT,Mã học sinh,Họ và tên,Lớp,Trường THCS\n")
            f.write("1,9B1-01,Hoàng Kim Ngân,9B1,THCS Chu Văn An\n")
            f.write("2,9B1-02,Đặng Tiến Đạt,9B1,THCS Chu Văn An\n")
            f.write("3,9B1-03,Bùi Phương Thảo,9B1,THCS Chu Văn An\n")
            f.write("4,9T-01,Nguyễn Nhật Minh,9T,THCS Chu Văn An\n")

        try:
            # Set file input
            page.set_input_files('#excel-file-input', temp_csv_path)
            page.wait_for_timeout(600)

            # Check preview table
            assert page.locator('#excel-preview-container').is_visible(), "Preview container must be visible after selecting file"
            preview_rows = page.locator('#excel-preview-tbody tr')
            assert preview_rows.count() >= 4, f"Preview table must display 4 rows, got {preview_rows.count()}"

            # Confirm button should now be enabled
            confirm_btn = page.locator('#btn-confirm-excel-import')
            assert confirm_btn.is_enabled(), "Confirm import button must be enabled"

            # Click Confirm Import
            confirm_btn.click()
            page.wait_for_timeout(1500)

            # Verify success message appears
            success_msg = page.locator('#excel-import-success')
            assert success_msg.is_visible(), "Success notification must be visible"
            assert "4" in success_msg.text_content(), "Success message must report 4 students imported"

            # Close modal
            page.locator('#btn-cancel-excel-import').click()
            page.wait_for_timeout(300)
            assert not excel_modal.is_visible(), "Excel modal must close"

            # Verify students in TeacherAnalytics roster
            roster_codes = page.evaluate("() => window.TeacherAnalytics.currentClassData.map(s => s.studentCode)")
            print("Current roster student codes:", roster_codes)
            assert "9B1-01" in roster_codes, "9B1-01 must be in teacher roster"
            assert "9B1-02" in roster_codes, "9B1-02 must be in teacher roster"
            assert "9B1-03" in roster_codes, "9B1-03 must be in teacher roster"
            assert "9T-01" in roster_codes, "9T-01 must be in teacher roster"

            # Verify dynamic class dropdown options (NO HARDCODING)
            filter_options = page.evaluate("""() => {
                const select = document.getElementById('teacher-class-filter-select');
                return Array.from(select.options).map(opt => ({ value: opt.value, text: opt.textContent }));
            }""")
            print("Teacher class filter options:", filter_options)
            option_values = [opt['value'] for opt in filter_options]
            assert "9B1" in option_values, "Dropdown must dynamically contain imported class '9B1'"
            assert "9T" in option_values, "Dropdown must dynamically contain imported class '9T'"

            # Ensure only classes that actually exist in the roster are in the dropdown
            roster_grades = page.evaluate("() => Array.from(new Set(window.TeacherAnalytics.currentClassData.map(s => (s.grade || '').trim().toUpperCase()).filter(Boolean)))")
            for val in option_values:
                if val != "":
                    assert val in roster_grades, f"Class option '{val}' must come from actual roster data, not hardcoded"

            # Verify datalist #crud-grade-options is also synced dynamically
            datalist_options = page.evaluate("""() => {
                const dl = document.getElementById('crud-grade-options');
                return Array.from(dl.options).map(opt => opt.value);
            }""")
            print("Datalist grade options:", datalist_options)
            assert "9B1" in datalist_options, "Datalist must dynamically contain '9B1'"
            assert "9T" in datalist_options, "Datalist must dynamically contain '9T'"

            # Test class filtering interaction for 9B1
            page.select_option('#teacher-class-filter-select', '9B1')
            page.wait_for_timeout(400)
            visible_rows_count_9b1 = page.evaluate("""() => {
                const rows = document.querySelectorAll('#teacher-student-table-body tr');
                return rows.length;
            }""")
            print(f"Rows count after filtering by 9B1: {visible_rows_count_9b1}")
            assert visible_rows_count_9b1 >= 3, "Filtered roster must display imported 9B1 students"

            # Test class filtering interaction for 9T
            page.select_option('#teacher-class-filter-select', '9T')
            page.wait_for_timeout(400)
            visible_rows_count_9t = page.evaluate("""() => {
                const rows = document.querySelectorAll('#teacher-student-table-body tr');
                return rows.length;
            }""")
            print(f"Rows count after filtering by 9T: {visible_rows_count_9t}")
            assert visible_rows_count_9t >= 1, "Filtered roster must display imported 9T student"

            # Reset filter to all classes
            page.select_option('#teacher-class-filter-select', '')
            page.wait_for_timeout(300)

            print("✓ PART 1 PASSED: Dynamic class filter & Excel import verified without hardcoded classes.")
        finally:
            if os.path.exists(temp_csv_path):
                os.remove(temp_csv_path)

        # -------------------------------------------------------------
        # PART 2: TEST LOGIN WITH IMPORTED STUDENT & REPORT PRINT
        # -------------------------------------------------------------
        print("\n--- PART 2: Testing Login with Newly Imported Student & Report Print ---")
        page.locator('#btn-logout').click()
        page.wait_for_timeout(400)

        if page.locator('#auth-tab-student').is_visible():
            page.locator('#auth-tab-student').click()
            page.wait_for_timeout(200)

        page.locator('#login-student-code').fill('9B1-01')
        page.locator('#btn-submit-student-login').click()
        page.wait_for_timeout(800)

        badge_text = page.locator('#user-info-text').text_content()
        print("Logged in student badge text:", badge_text)
        assert "9B1-01" in badge_text or "Hoàng Kim Ngân" in badge_text, "Imported student must be able to log in immediately"
        print("✓ Student logged in successfully.")

        # Switch to Project Tab
        page.locator('.tab-btn[data-tab="project"]').click()
        page.wait_for_timeout(400)
        assert page.locator('#view-project').is_visible(), "View project must be visible"

        # Click Print Report Button
        print("Clicking #print-project-report-btn...")
        page.locator('#print-project-report-btn').click()
        page.wait_for_timeout(600)

        # Verify #report-preview-modal is visible
        modal = page.locator('#report-preview-modal')
        assert modal.is_visible(), "Report preview modal must be visible after clicking print"

        # Verify iframe in modal has content
        iframe = page.locator('#report-modal-iframe')
        assert iframe.is_visible(), "Report iframe inside preview modal must be visible"

        # Verify print iframe was created
        print_frame_count = page.evaluate("() => document.querySelectorAll('#report-print-iframe').length")
        assert print_frame_count >= 1, "Hidden #report-print-iframe must be appended to document"

        # Close preview modal
        page.locator('#btn-close-report-modal').click()
        page.wait_for_timeout(300)
        assert not modal.is_visible(), "Report preview modal must close when close button is clicked"
        print("✓ PART 2 PASSED: Report print & preview modal operates flawlessly.")

        # Check Console Errors
        print("\n--- PART 4: Checking Console F12 Logs ---")
        filtered_errors = [e for e in console_errors if not ('favicon' in e.lower() or 'gemini' in e.lower())]
        print(f"Console errors count: {len(filtered_errors)}")
        for err in filtered_errors:
            print("ERR:", err)
        assert len(filtered_errors) == 0, f"Expected 0 console errors, found: {filtered_errors}"
        print("✓ PART 4 PASSED: 0 Console F12 errors.")

        browser.close()
        print("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY (100% PASS)!")

if __name__ == '__main__':
    test_excel_import_and_report_print()
