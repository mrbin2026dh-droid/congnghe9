# -*- coding: utf-8 -*-
"""
Test Suite: Holland Survey Standardization & Deep Analytics
Verifies Question Grid palette navigation, Likert response selection,
progress indicator, 6-category RIASEC score visualization, and major recommendation link.
"""
import os
import json
import urllib.parse
from playwright.sync_api import sync_playwright

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_holland_standardization():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.goto(url)
        page.wait_for_load_state('domcontentloaded')

        # Student login to enter learning view
        page.locator('#login-student-code').fill('9A1-01')
        page.locator('#btn-submit-student-login').click()
        page.wait_for_timeout(300)

        # Navigate to Quiz Tab
        quiz_tab_btn = page.locator('.tab-btn[data-tab="quiz"]')
        quiz_tab_btn.click()
        page.wait_for_timeout(300)

        # Check Question Palette exists
        palette = page.locator('#quiz-question-palette')
        assert palette.count() == 1, "Question palette grid must exist"

        # Switch to Quick Mode (18 questions)
        quick_btn = page.locator('#quiz-mode-quick')
        quick_btn.click()
        page.wait_for_timeout(300)

        # Palette should have exactly 18 items
        palette_items = page.locator('.palette-item')
        assert palette_items.count() == 18, f"Quick mode should have 18 palette items, got {palette_items.count()}"

        # Test jumping to Question 5 via Palette
        item_5 = palette_items.nth(4) # 0-indexed = question 5
        item_5.click()
        page.wait_for_timeout(200)

        # Verify current question is 5
        progress_text = page.locator('#quiz-progress-text').text_content()
        assert "5 / 18" in progress_text, f"Expected Question 5 / 18, got '{progress_text}'"

        # Answer question 5 (click Likert button 4)
        likert_btns = page.locator('#quiz-likert-container .likert-btn')
        assert likert_btns.count() == 5, "Must render 5 Likert buttons"
        likert_btns.nth(3).click() # button 4
        page.wait_for_timeout(200)

        # Verify palette item 5 now has 'answered' class
        assert "answered" in item_5.get_attribute("class"), "Palette item 5 should be marked as answered"

        # Complete all 18 questions rapidly via evaluate to test result screen
        page.evaluate("""() => {
            const answers = [5, 4, 5, 4, 5, 3, 2, 2, 3, 3, 2, 2, 4, 3, 4, 3, 3, 4];
            window.app.quizAnswers = answers;
            window.app.finalizeQuizResults();
        }""")
        page.wait_for_timeout(400)

        # Result card must be visible
        result_card = page.locator('#quiz-result-card')
        assert result_card.is_visible(), "Quiz result card must be visible after completion"

        # Check 6 RIASEC categories breakdown table / bars exist
        riasec_breakdown = page.locator('#quiz-riasec-breakdown')
        assert riasec_breakdown.count() == 1, "RIASEC score breakdown container must exist"

        # Check matched majors container has items
        matched_majors = page.locator('#quiz-matched-majors-grid .card-panel')
        assert matched_majors.count() >= 3, f"Must show at least 3 matched majors, got {matched_majors.count()}"

        # Check "Chọn Ngành Này Cho Bài 5" button exists on first major
        select_major_btn = matched_majors.first.locator('button')
        assert "Bài 5" in select_major_btn.text_content(), "Must have button to select major for Lesson 5"

        browser.close()
        print("HOLLAND SURVEY STANDARDIZATION TESTS PASSED!")

if __name__ == '__main__':
    test_holland_standardization()
