# -*- coding: utf-8 -*-
"""
Test Suite: Multi-School Student Profile & Persistence Engine
Verifies that student profile (School, Grade, Name) can be edited, saved to LocalStorage,
retained on page reload, exported to JSON, and imported from JSON.
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

        # Check that school, grade, and name inputs exist
        school_input = page.locator('#student-school-input')
        grade_input = page.locator('#student-grade-input')
        name_input = page.locator('#student-name-input')

        assert school_input.count() == 1, "School input must exist"
        assert grade_input.count() == 1, "Grade input must exist"
        assert name_input.count() == 1, "Name input must exist"

        # Step 2: Fill in school, grade, name
        test_school = "THCS Lê Quý Đôn"
        test_grade = "9A2"
        test_name = "Trần Thị Mai"

        school_input.fill(test_school)
        grade_input.fill(test_grade)
        name_input.fill(test_name)

        # Trigger change / blur events
        name_input.press("Enter")
        page.wait_for_timeout(300)

        # Check that localStorage contains the saved profile
        saved_profile_raw = page.evaluate("() => localStorage.getItem('edupath_student_profile')")
        assert saved_profile_raw is not None, "Profile must be saved in localStorage"
        saved_profile = json.loads(saved_profile_raw)
        assert saved_profile.get('name') == test_name
        assert saved_profile.get('school') == test_school
        assert saved_profile.get('grade') == test_grade

        # Step 3: Reload page and verify data persists
        page.reload()
        page.wait_for_load_state('domcontentloaded')

        reloaded_school = page.locator('#student-school-input').input_value()
        reloaded_grade = page.locator('#student-grade-input').input_value()
        reloaded_name = page.locator('#student-name-input').input_value()

        assert reloaded_school == test_school, f"Expected {test_school}, got {reloaded_school}"
        assert reloaded_grade == test_grade, f"Expected {test_grade}, got {reloaded_grade}"
        assert reloaded_name == test_name, f"Expected {test_name}, got {reloaded_name}"

        # Step 4: Check export & import functionality
        assert page.locator('#export-profile-btn').count() == 1, "Export profile button must exist"
        assert page.locator('#import-profile-btn').count() == 1, "Import profile button must exist"

        browser.close()
        print("ALL PROFILE PERSISTENCE TESTS PASSED!")

if __name__ == '__main__':
    test_student_profile_persistence()
