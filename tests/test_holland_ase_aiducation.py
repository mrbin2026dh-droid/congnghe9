# -*- coding: utf-8 -*-
"""
Test Suite: Holland Order Recommended Careers (Aiducation Reverse Engineered) & H2 Tech Majors
Verifies User Requirements:
1. Holland code ASE produces recommended careers matching letters in order: A -> S -> E
   Referencing Aiducation https://www.aiducation.edu.vn/huong-nghiep/ket-qua/8F4iHUMjZCuNVxc4:
   - Báo chí (ASE)
   - Ngôn ngữ Anh (ASC)
   - Âm nhạc (ASR)
   - Sư phạm Ngữ văn (SAC)
   - Giáo dục tiểu học (SAC)
   - Giáo dục mầm non (SAR)
   - Điện ảnh — truyền hình (AER)
   - Truyền thông đa phương tiện (ARE)
2. This section is inserted BEFORE H2.
3. H2 title is updated to "🎯 Top ngành nghề thuộc lĩnh vực kỹ thuật, công nghệ phù hợp".
4. The existing tech/engineering majors under H2 are kept intact with functionality "Chọn Ngành Này Cho Bài 5 ➔".
5. 0 Console F12 errors, 0 layout overflow.
"""
import sys
import os
import urllib.parse
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_ase_aiducation_flow():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Test resolutions: 1920x1080 and 1366x768
        for res_w, res_h in [(1920, 1080), (1366, 768)]:
            print(f"\n=================== Testing resolution {res_w}x{res_h} ===================")
            context = browser.new_context(viewport={'width': res_w, 'height': res_h})
            page = context.new_page()

            console_errors = []
            page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

            page.goto(url)
            page.wait_for_load_state('domcontentloaded')

            # Log in as student
            page.locator('#login-student-code').fill('NH-9A1')
            page.locator('#btn-submit-student-login').click()
            page.wait_for_timeout(300)

            # Switch to Quiz tab
            page.locator('.tab-btn[data-tab="quiz"]').click()
            page.wait_for_timeout(300)

            # Input exact scores for ASE from user screenshot:
            # R: 3/15 (20%), I: 6/15 (40%), A: 15/15 (100%), S: 12/15 (80%), E: 8/15 (53%), C: 7/15 (47%)
            page.locator('#quiz-mode-quick').click()
            page.wait_for_timeout(200)

            page.evaluate("""() => {
                window.app.quizAnswers = [
                    1, 1, 1, // R: 3/15 (20%)
                    2, 2, 2, // I: 6/15 (40%)
                    5, 5, 5, // A: 15/15 (100%)
                    4, 4, 4, // S: 12/15 (80%)
                    3, 3, 2, // E: 8/15 (53%)
                    3, 2, 2  // C: 7/15 (47%)
                ];
                window.app.finalizeQuizResults();
            }""")
            page.wait_for_timeout(400)

            # 1. Assert Holland code is ASE
            code_text = page.locator('#result-holland-code').text_content().strip()
            print(f"Computed Holland Code: {code_text}")
            assert code_text == 'ASE', f"Expected code ASE, got '{code_text}'"

            # 2. Assert Proposed Careers Section is BEFORE H2
            dom_order = page.evaluate("""() => {
                const orderSec = document.getElementById('quiz-holland-order-section');
                const h2Heading = document.getElementById('quiz-tech-majors-heading');
                if (!orderSec || !h2Heading) return null;
                // Check if orderSec comes before h2Heading in document order
                const position = orderSec.compareDocumentPosition(h2Heading);
                return {
                    orderSecExists: true,
                    h2Exists: true,
                    isBefore: (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
                    h2Tag: h2Heading.tagName,
                    h2Text: h2Heading.textContent.trim()
                };
            }""")
            print(f"DOM Ordering Check: {dom_order}")
            assert dom_order is not None and dom_order['orderSecExists'] and dom_order['h2Exists'], "Elements missing in DOM"
            assert dom_order['isBefore'], "quiz-holland-order-section must be placed BEFORE H2!"
            assert dom_order['h2Tag'] == 'H2', f"Tech majors heading must be H2, got {dom_order['h2Tag']}"
            assert "kỹ thuật, công nghệ phù hợp" in dom_order['h2Text'].lower(), f"H2 title mismatch: {dom_order['h2Text']}"

            # 3. Verify Aiducation Careers Ranking for ASE
            cards = page.locator('#quiz-holland-order-majors-grid .card-panel')
            card_count = cards.count()
            print(f"Proposed Holland Order Careers rendered: {card_count}")
            assert card_count >= 8, f"Expected at least 8 recommended careers, got {card_count}"

            # Check top item is Báo chí (ASE)
            first_title = cards.nth(0).locator('span').first.text_content().strip()
            first_code = cards.nth(0).locator('span').nth(1).text_content().strip()
            print(f"#1 Career: {first_title} ({first_code})")
            assert "báo chí" in first_title.lower(), f"Expected #1 to be Báo chí, got '{first_title}'"
            assert "ASE" in first_code, f"Expected #1 code to be ASE, got '{first_code}'"

            # Check that careers contain Aiducation top matches: Ngôn ngữ Anh, Âm nhạc, Sư phạm, Điện ảnh...
            all_titles = [cards.nth(i).locator('span').first.text_content().strip() for i in range(card_count)]
            print("All top titles:", all_titles)
            assert any("ngôn ngữ anh" in t.lower() for t in all_titles), "Missing Ngôn ngữ Anh"
            assert any("âm nhạc" in t.lower() for t in all_titles), "Missing Âm nhạc"
            assert any("sư phạm ngữ văn" in t.lower() for t in all_titles), "Missing Sư phạm Ngữ văn"
            assert any("giáo dục tiểu học" in t.lower() for t in all_titles), "Missing Giáo dục tiểu học"
            assert any("giáo dục mầm non" in t.lower() for t in all_titles), "Missing Giáo dục mầm non"
            assert any("điện ảnh" in t.lower() for t in all_titles), "Missing Điện ảnh — truyền hình"

            # 4. Verify Dynamic Letter Filter Pills (Chữ cái 1: A, Chữ cái 2: S, Chữ cái 3: E)
            pills = page.locator('#holland-letter-filter-pills button')
            pill_count = pills.count()
            assert pill_count == 4, f"Expected 4 filter pills (Tất cả, C1, C2, C3), got {pill_count}"
            pill_texts = [pills.nth(i).text_content().strip() for i in range(pill_count)]
            print(f"Filter Pills: {pill_texts}")
            assert any("A" in t for t in pill_texts), "Filter pill for letter A missing"
            assert any("S" in t for t in pill_texts), "Filter pill for letter S missing"
            assert any("E" in t for t in pill_texts), "Filter pill for letter E missing"

            # Test filtering by letter S
            pills.nth(2).click() # Click S pill
            page.wait_for_timeout(200)
            s_cards = page.locator('#quiz-holland-order-majors-grid .card-panel')
            s_titles = [s_cards.nth(i).locator('span').first.text_content().strip() for i in range(s_cards.count())]
            print(f"Filtered by letter S ({s_cards.count()} items): {s_titles}")
            assert len(s_titles) > 0, "No items displayed for letter S"
            # Every item in S should have primary type S
            for i in range(s_cards.count()):
                code_badge = s_cards.nth(i).locator('span').nth(1).text_content().strip()
                assert "Mã: S" in code_badge, f"Expected item starting with S, got '{code_badge}'"

            # Return to All
            pills.nth(0).click()
            page.wait_for_timeout(200)

            # 5. Verify Existing H2 Tech/Engineering Majors are Kept Intact
            tech_cards = page.locator('#quiz-matched-majors-grid .card-panel')
            tech_count = tech_cards.count()
            print(f"Tech/Engineering Majors rendered under H2: {tech_count}")
            assert tech_count == 6, f"Expected 6 tech majors under H2, got {tech_count}"

            # Top tech major for ASE should be UI/UX
            top_tech_title = tech_cards.nth(0).locator('span').first.text_content().strip()
            print(f"Top Tech Major under H2: {top_tech_title}")
            assert "thiết kế đồ họa" in top_tech_title.lower() or "ui/ux" in top_tech_title.lower(), f"Expected UI/UX, got '{top_tech_title}'"

            # Button "Chọn Ngành Này Cho Bài 5" works
            btn_choose = tech_cards.nth(0).locator('button')
            assert "Chọn Ngành Này Cho Bài 5" in btn_choose.text_content(), "Button missing or renamed"
            btn_choose.click()
            page.wait_for_timeout(300)

            # Verify targetMajorName updated
            selected_major = page.evaluate("() => window.app.studentProfile.targetMajorName")
            print(f"Selected major for Bài 5: {selected_major}")
            assert "thiết kế đồ họa" in selected_major.lower() or "ui/ux" in selected_major.lower()

            # 6. Verify Zero Horizontal Overflow
            overflow = page.evaluate("() => document.documentElement.scrollWidth > document.documentElement.clientWidth")
            assert not overflow, f"Layout overflow detected at {res_w}x{res_h}!"

            # 7. Check Console Errors
            print(f"Console errors at {res_w}x{res_h}: {console_errors}")
            assert len(console_errors) == 0, f"F12 console errors found: {console_errors}"

            context.close()

        browser.close()
        print("\n>>> ALL CHECKS PASSED: Holland Order Careers + H2 Tech Majors verified! <<<")

if __name__ == '__main__':
    test_ase_aiducation_flow()
