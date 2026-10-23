# -*- coding: utf-8 -*-
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

def test_unified_advisor():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

        page.goto(url)
        page.wait_for_load_state('domcontentloaded')

        print("=== STEP 1: Student Login with Holland ASE Profile ===")
        page.locator('#login-student-code').fill('NH-9A1')
        page.locator('#btn-submit-student-login').click()
        page.wait_for_timeout(300)

        # Set student profile code to ASE
        page.evaluate("""() => {
            const prof = JSON.parse(localStorage.getItem('edupath_student_profile') || '{}');
            prof.code = 'ASE';
            prof.name = 'Nguyễn Văn A';
            prof.scores = { A: 85, S: 75, E: 70, R: 40, I: 35, C: 30 };
            prof.targetMajorName = 'Kỹ thuật âm thanh & Thiết kế đa phương tiện';
            localStorage.setItem('edupath_student_profile', JSON.stringify(prof));
            if (window.EduPathApp) {
                window.EduPathApp.studentProfile = prof;
            }
        }""")

        # Open AI Advisor tab
        page.locator('.tab-btn[data-tab="agents"]').click()
        page.wait_for_timeout(300)

        # Verify unified advisor card exists
        card = page.locator('.unified-advisor-card')
        assert card.count() == 1, "Unified advisor card must exist"
        advisor_name = card.locator('.advisor-name').text_content()
        print(f"Unified Advisor Active: {advisor_name}")
        assert "TS. Hướng Nghiệp TeenVoca" in advisor_name or "TS. Hướng Nghiệp EduPath" in advisor_name

        # Verify 4 pillar tags exist
        pillars = card.locator('.pillar-tag').all_text_contents()
        print(f"Pillars rendered: {pillars}")
        assert len(pillars) == 4

        print("\n=== STEP 2: Ask 'Em thích hát' ===")
        input_el = page.locator('#chat-input-text')
        send_btn = page.locator('#chat-send-btn')

        input_el.fill("Em thích hát")
        send_btn.click()

        # Wait for response bubble to appear and finish typewriter animation
        page.wait_for_selector('.chat-bubble.agent.is-typing', timeout=15000)
        page.wait_for_selector('.chat-bubble.agent.is-typing', state='detached', timeout=15000)
        bubble1 = page.locator('#chat-messages-scroll .chat-bubble.agent').last
        text1 = bubble1.text_content()
        print(f"Response 1:\n{text1}\n")
        assert len(text1) > 80
        # Must mention Artistic or Nghệ thuật
        assert "nghệ thuật" in text1.lower() or "artistic" in text1.lower()

        print("\n=== STEP 3: Ask 'Vậy chọn nghề nào' ===")
        page.wait_for_timeout(600)
        input_el.fill("Vậy chọn nghề nào")
        send_btn.click()

        page.wait_for_selector('.chat-bubble.agent.is-typing', timeout=15000)
        page.wait_for_selector('.chat-bubble.agent.is-typing', state='detached', timeout=15000)
        bubble2 = page.locator('#chat-messages-scroll .chat-bubble.agent').last
        text2 = bubble2.text_content()
        print(f"Response 2:\n{text2}\n")
        assert len(text2) > 100
        # Check it does NOT end abruptly
        assert not text2.rstrip().endswith("tôi") and not text2.rstrip().endswith("là")
        # Must reference Holland / career advice
        assert "nghề" in text2.lower()

        # Check console errors (ignoring expected external 429 rate limits)
        unhandled_errors = [e for e in console_errors if '429' not in e]
        print("Unhandled console errors:", unhandled_errors)
        assert len(unhandled_errors) == 0

        context.close()
        browser.close()
        print(">>> TEST UNIFIED ADVISOR PASSED 100%! <<<")

if __name__ == '__main__':
    test_unified_advisor()
