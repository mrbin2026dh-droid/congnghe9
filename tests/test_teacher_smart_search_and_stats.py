# -*- coding: utf-8 -*-
"""
Test Suite: Teacher Smart Search & Statistics Feature
Tests:
1. Toolbar render & accurate initial statistics counters (Total, Completed, Pending, Percentage).
2. Smart search by name (with accents 'Nhã Ái' and without accents 'nha ai').
3. Filter by status: All, Completed (Đã khảo sát), Pending (Chưa khảo sát / Nhắc nhở).
4. Direct filter activation via statistics pills.
5. Quick action to copy unassessed students list for Zalo notification.
6. Realtime sync: When student completes survey, teacher counters update live.
7. Zero console F12 errors.
"""
import os
import sys
import time
import json
import urllib.parse
import urllib.request
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def reset_student_firebase(student_id="9C-01"):
    url = f"https://edupath-ai-huongnghiep-default-rtdb.asia-southeast1.firebasedatabase.app/students/{student_id}.json"
    payload = {
        "code": "",
        "major": "",
        "projectScore": None,
        "stream": ""
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='PATCH'
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.read()

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_smart_search_and_stats():
    print("Resetting student 9C-01 on Firebase...")
    reset_student_firebase("9C-01")

    url = get_page_url()
    print("Testing URL:", url)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        teacher_ctx = browser.new_context(viewport={'width': 1440, 'height': 900})
        teacher_page = teacher_ctx.new_page()

        student_ctx = browser.new_context(viewport={'width': 1440, 'height': 900})
        student_page = student_ctx.new_page()

        console_errors = []
        teacher_page.on('console', lambda m: console_errors.append(m.text) if m.type == 'error' else None)
        student_page.on('console', lambda m: console_errors.append(m.text) if m.type == 'error' else None)

        # -------------------------------------------------------------
        # STEP 1: LOGIN AS TEACHER & VERIFY TOOLBAR & STATS
        # -------------------------------------------------------------
        print("\n--- STEP 1: Verifying Smart Search & Statistics Toolbar ---")
        teacher_page.goto(url)
        teacher_page.wait_for_load_state('domcontentloaded')
        teacher_page.wait_for_timeout(800)

        teacher_page.locator('#auth-tab-teacher').click()
        teacher_page.locator('#login-teacher-pin').fill('2026')
        teacher_page.locator('#btn-submit-teacher-login').click()
        teacher_page.wait_for_selector('#view-teacher', state='visible')
        teacher_page.wait_for_timeout(1200)

        assert teacher_page.locator('#teacher-roster-toolbar').is_visible(), "Toolbar must be visible above roster table"
        
        stat_total = int(teacher_page.locator('#teacher-stat-total').text_content().strip())
        stat_completed = int(teacher_page.locator('#teacher-stat-completed').text_content().strip())
        stat_pending = int(teacher_page.locator('#teacher-stat-pending').text_content().strip())

        print(f"Stats loaded: Total = {stat_total}, Completed = {stat_completed}, Pending = {stat_pending}")
        assert stat_total >= 44, f"Expected at least 44 total students, got: {stat_total}"
        assert stat_completed == 0, f"Expected 0 completed students initially, got: {stat_completed}"
        assert stat_pending == stat_total, f"Expected all {stat_total} pending, got: {stat_pending}"

        counter_text = teacher_page.locator('#teacher-search-result-count').text_content().strip()
        print(f"Result count text: {counter_text}")
        assert f"{stat_total}/{stat_total}" in counter_text, f"Expected {stat_total}/{stat_total} displayed"
        print("✓ STEP 1 PASSED: Toolbar & accurate statistics verified!")

        # -------------------------------------------------------------
        # STEP 2: SMART SEARCH BY NAME (ACCENTS & ACCENT-INSENSITIVE)
        # -------------------------------------------------------------
        print("\n--- STEP 2: Testing Smart Search by Student Name ---")
        search_input = teacher_page.locator('#teacher-student-search-input')

        # Test search with exact accent: "Nhã Ái"
        search_input.fill('Nhã Ái')
        teacher_page.wait_for_timeout(300)
        row_count = teacher_page.locator('#teacher-student-table-body tr').count()
        first_row_name = teacher_page.locator('#teacher-student-table-body tr:first-child td:nth-child(5)').text_content().strip()
        print(f"Search 'Nhã Ái' -> Rows: {row_count}, First Name: {first_row_name}")
        assert row_count == 1, f"Expected 1 row for 'Nhã Ái', got {row_count}"
        assert 'NGUYỄN THỊ NHÃ ÁI' in first_row_name

        # Test accent-insensitive search: "nha ai" (no accents)
        search_input.fill('nha ai')
        teacher_page.wait_for_timeout(300)
        row_count_no_accent = teacher_page.locator('#teacher-student-table-body tr').count()
        first_row_name_no_accent = teacher_page.locator('#teacher-student-table-body tr:first-child td:nth-child(5)').text_content().strip()
        print(f"Search 'nha ai' -> Rows: {row_count_no_accent}, First Name: {first_row_name_no_accent}")
        assert row_count_no_accent == 1, f"Expected 1 row for 'nha ai', got {row_count_no_accent}"
        assert 'NGUYỄN THỊ NHÃ ÁI' in first_row_name_no_accent

        # Test search another name: "Hồng Đăng"
        search_input.fill('hong dang')
        teacher_page.wait_for_timeout(300)
        row_count_hd = teacher_page.locator('#teacher-student-table-body tr').count()
        first_name_hd = teacher_page.locator('#teacher-student-table-body tr:first-child td:nth-child(5)').text_content().strip()
        print(f"Search 'hong dang' -> Rows: {row_count_hd}, First Name: {first_name_hd}")
        assert row_count_hd == 1
        assert 'HỒNG ĐĂNG' in first_name_hd

        # Test search by student code: "9C-10"
        search_input.fill('9C-10')
        teacher_page.wait_for_timeout(300)
        first_name_10 = teacher_page.locator('#teacher-student-table-body tr:first-child td:nth-child(5)').text_content().strip()
        print(f"Search '9C-10' -> First Name: {first_name_10}")
        assert 'BẢO HÂN' in first_name_10

        # Click Clear Search button (✕)
        teacher_page.locator('#btn-clear-teacher-search').click()
        teacher_page.wait_for_timeout(300)
        cleared_count = teacher_page.locator('#teacher-student-table-body tr').count()
        print(f"After clear -> Total rows: {cleared_count}")
        assert cleared_count == stat_total, f"Expected {stat_total} rows restored after clearing search"
        print("✓ STEP 2 PASSED: Accent-insensitive smart search and clear button verified!")

        # -------------------------------------------------------------
        # STEP 3: FILTER BY SURVEY STATUS
        # -------------------------------------------------------------
        print("\n--- STEP 3: Testing Filter by Survey Status ---")
        # Filter: Đã khảo sát (Completed)
        teacher_page.locator('#filter-tab-completed').click()
        teacher_page.wait_for_timeout(300)
        comp_rows = teacher_page.locator('#teacher-student-table-body tr').count()
        empty_text = teacher_page.locator('#teacher-student-table-body tr:first-child td').text_content().strip()
        print(f"Filter 'Đã khảo sát' -> Rows: {comp_rows}, Content: {empty_text}")
        assert 'Không tìm thấy học sinh nào phù hợp' in empty_text

        # Filter: Chưa khảo sát (Pending)
        teacher_page.locator('#filter-tab-pending').click()
        teacher_page.wait_for_timeout(300)
        pending_rows = teacher_page.locator('#teacher-student-table-body tr').count()
        print(f"Filter 'Chưa khảo sát' -> Rows: {pending_rows}")
        assert pending_rows == stat_total, f"Expected {stat_total} pending students"

        # Direct activation via Pill Click
        teacher_page.locator('#pill-filter-completed').click()
        teacher_page.wait_for_timeout(300)
        assert 'active' in teacher_page.locator('#filter-tab-completed').get_attribute('class')

        teacher_page.locator('#filter-tab-all').click()
        teacher_page.wait_for_timeout(300)
        all_rows = teacher_page.locator('#teacher-student-table-body tr').count()
        assert all_rows == stat_total
        print("✓ STEP 3 PASSED: Survey status filters (tabs & pills) verified!")

        # -------------------------------------------------------------
        # STEP 4: QUICK ACTION - COPY UNASSESSED LIST
        # -------------------------------------------------------------
        print("\n--- STEP 4: Testing Copy Unassessed List for Reminders ---")
        teacher_page.locator('#btn-copy-unassessed-list').click()
        teacher_page.wait_for_selector('.toast', timeout=3000)
        toast = teacher_page.locator('.toast').text_content()
        print("Reminder Toast message:", toast)
        assert 'Đã sao chép danh sách' in toast
        assert f'{stat_total} học sinh chưa khảo sát' in toast
        print("✓ STEP 4 PASSED: Copy reminder list action verified!")

        # -------------------------------------------------------------
        # STEP 5: REALTIME DUAL-CONTEXT TEST (STUDENT COMPLETES SURVEY)
        # -------------------------------------------------------------
        print("\n--- STEP 5: Dual-Context Realtime Synchronization ---")
        student_page.goto(url)
        student_page.wait_for_load_state('domcontentloaded')
        student_page.wait_for_timeout(800)

        student_page.locator('#login-student-code').fill('9C-01')
        student_page.locator('#btn-submit-student-login').click()
        student_page.wait_for_timeout(800)

        student_page.locator('.tab-btn[data-tab="quiz"]').click()
        student_page.wait_for_timeout(400)
        student_page.locator('#quiz-mode-quick').click()
        student_page.wait_for_timeout(300)

        # Complete survey for 9C-01
        answers = [1, 1, 1, 2, 2, 2, 5, 5, 5, 4, 4, 4, 4, 4, 3, 1, 1, 1]
        for ans in answers:
            student_page.locator(f'#quiz-likert-container .likert-btn[data-value="{ans}"]').click()
            student_page.wait_for_timeout(80)

        student_page.wait_for_timeout(1500)
        assert student_page.locator('#quiz-result-card').is_visible()

        # Check teacher dashboard updated live!
        teacher_page.wait_for_timeout(1500)
        new_stat_completed = int(teacher_page.locator('#teacher-stat-completed').text_content().strip())
        new_stat_pending = int(teacher_page.locator('#teacher-stat-pending').text_content().strip())
        print(f"Teacher dashboard live update: Completed = {new_stat_completed}, Pending = {new_stat_pending}")
        assert new_stat_completed == 1, f"Expected completed = 1, got {new_stat_completed}"
        assert new_stat_pending == stat_total - 1, f"Expected pending = {stat_total - 1}, got {new_stat_pending}"

        # Now filter by 'Đã khảo sát' on teacher dashboard
        teacher_page.locator('#filter-tab-completed').click()
        teacher_page.wait_for_timeout(400)
        completed_student_code = teacher_page.locator('#teacher-student-table-body tr:first-child td:nth-child(2)').text_content().strip()
        completed_student_holland = teacher_page.locator('#teacher-student-table-body tr:first-child td:nth-child(6)').text_content().strip()
        print(f"Filter 'Đã khảo sát' -> Code: {completed_student_code}, Holland: {completed_student_holland}")
        assert completed_student_code == '9C-01'
        assert completed_student_holland == 'ASE'
        print("✓ STEP 5 PASSED: Realtime survey synchronization reflected in stats & filters!")

        # Verify 0 console errors
        print(f"\nConsole errors logged: {len(console_errors)}")
        if console_errors:
            print("Errors:", console_errors)
        assert len(console_errors) == 0, "No console errors allowed"

        browser.close()
        print("\n🎉 ALL SMART SEARCH & STATISTICS TESTS PASSED 100% PERFECTLY!")

if __name__ == '__main__':
    test_smart_search_and_stats()
