# -*- coding: utf-8 -*-
"""
Verification Test Suite:
1. Gemini Model 404 Fix & Auto-Recovery (migration to gemini-2.0-flash and candidate loop).
2. Typewriter Effect (Hiệu ứng đánh máy) for AI Expert Chat Responses.
3. Zero console errors and interactive responsiveness.
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

def test_gemini_and_typewriter():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        console_errors = []
        all_logs = []
        page.on('console', lambda msg: all_logs.append(f"[{msg.type}] {msg.text}"))
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

        page.goto(url)
        page.wait_for_load_state('domcontentloaded')

        print("\n=== STEP 1: Verify Gemini Configuration & Model Migration ===")
        # Check model select options in DOM
        options = page.eval_on_selector_all('#gemini-model-select option', 'opts => opts.map(o => ({ value: o.value, text: o.text, selected: o.selected }))')
        print("Available Gemini Models in Dropdown:", options)
        
        # Verify gemini-2.5-flash is available and selected by default
        has_25_flash = any(o['value'] == 'gemini-2.5-flash' for o in options)
        assert has_25_flash, "gemini-2.5-flash must be present in model dropdown"
        selected_option = next(o for o in options if o['selected'])
        assert selected_option['value'] == 'gemini-2.5-flash', f"Expected default gemini-2.5-flash, got '{selected_option['value']}'"

        # Verify auto-migration of legacy 'gemini-1.5-flash' and 'gemini-2.0-flash' in localStorage
        migration_check = page.evaluate("""() => {
            localStorage.setItem('EDUPATH_GEMINI_MODEL', 'gemini-1.5-flash');
            const cfg1 = window.AIAgentsManager.getGeminiConfig();
            const res1 = { configured: cfg1.model, saved: localStorage.getItem('EDUPATH_GEMINI_MODEL') };
            
            localStorage.setItem('EDUPATH_GEMINI_MODEL', 'gemini-2.0-flash');
            const cfg2 = window.AIAgentsManager.getGeminiConfig();
            const res2 = { configured: cfg2.model, saved: localStorage.getItem('EDUPATH_GEMINI_MODEL') };
            return { res1, res2 };
        }""")
        print(f"Model Migration Check: {migration_check}")
        assert migration_check['res1']['configured'] == 'gemini-2.5-flash', "Legacy gemini-1.5-flash must be auto-migrated to gemini-2.5-flash"
        assert migration_check['res1']['saved'] == 'gemini-2.5-flash', "Saved model in localStorage must be updated"
        assert migration_check['res2']['configured'] == 'gemini-2.5-flash', "Legacy gemini-2.0-flash must be auto-migrated to gemini-2.5-flash"
        assert migration_check['res2']['saved'] == 'gemini-2.5-flash', "Saved model in localStorage must be updated"

        print("\n=== STEP 2: Log in as student and open AI Agents Room ===")
        page.locator('#login-student-code').fill('NH-9A1')
        page.locator('#btn-submit-student-login').click()
        page.wait_for_timeout(300)

        # Switch to Agents tab
        page.locator('.tab-btn[data-tab="agents"]').click()
        page.wait_for_timeout(300)

        # Verify initial greeting exists
        chat_box = page.locator('#chat-messages-scroll')
        assert chat_box.locator('.chat-bubble.agent').count() >= 1, "Initial greeting bubble missing"

        print("\n=== STEP 3: Test Typewriter Effect on Sending Message ===")
        input_el = page.locator('#chat-input-text')
        send_btn = page.locator('#chat-send-btn')

        # Send test message
        test_msg = "Bố mẹ muốn em theo nghề khác thì em nên nói chuyện thế nào?"
        input_el.fill(test_msg)
        send_btn.click()

        # While sending, check input is disabled and typing indicator appears
        print("Message sent, checking typing indicator...")
        page.wait_for_selector('.chat-bubble.agent.typing-indicator', timeout=2000)
        assert page.locator('#chat-send-btn').is_disabled(), "Send button must be disabled during response generation"

        # Wait for agent response bubble to appear with typewriter effect
        print("Waiting for response bubble...")
        try:
            page.wait_for_selector('.chat-bubble.agent.is-typing', timeout=15000)
        except Exception as e:
            print("Console logs during failure:")
            for log in all_logs[-15:]:
                print(log)
            raise e
        typing_bubble = page.locator('.chat-bubble.agent.is-typing')
        assert typing_bubble.count() == 1, "Agent response bubble should have .is-typing class during animation"

        # Verify blinking cursor exists
        cursor = typing_bubble.locator('.typewriter-cursor')
        assert cursor.count() == 1, "Typewriter cursor (▌) must be present during typing"
        cursor_text = cursor.text_content().strip()
        print(f"Cursor active: '{cursor_text}'")
        assert cursor_text == '▌', f"Expected cursor '▌', got '{cursor_text}'"

        # Check that typed content is streaming
        partial_text = typing_bubble.locator('.agent-typed-content').text_content()
        print(f"Partial streaming text sample: '{partial_text[:40]}...'")

        # Wait for typewriter animation to complete (until .is-typing is removed from last bubble)
        page.wait_for_function("() => !document.querySelector('#chat-messages-scroll .chat-bubble.agent:last-child').classList.contains('is-typing')", timeout=5000)
        print("Typewriter animation completed successfully!")

        # Verify cursor is removed and final content is rendered
        final_bubble = page.locator('#chat-messages-scroll .chat-bubble.agent').last
        assert final_bubble.locator('.typewriter-cursor').count() == 0, "Cursor must be removed when typing completes"
        final_text = final_bubble.text_content()
        print(f"Final Agent Text: '{final_text[:80]}...'")
        assert len(final_text) > 50, "Final text must not be empty"
        assert "TS. Minh Tâm" in final_text, "Expected agent name in response bubble"

        # Verify send button and input are re-enabled
        assert not page.locator('#chat-send-btn').is_disabled(), "Send button must be re-enabled"
        assert not page.locator('#chat-input-text').is_disabled(), "Input must be re-enabled"

        print("\n=== STEP 4: Test Click-to-Finish-Immediately (Skip Animation) ===")
        # Send second message and click bubble to finish immediately
        input_el.fill("Con gái có thể theo ngành Cơ điện tử hay Công nghệ thông tin không?")
        send_btn.click()

        # Wait for typing bubble to appear
        page.wait_for_selector('.chat-bubble.agent.is-typing', timeout=15000)
        typing_bubble2 = page.locator('.chat-bubble.agent.is-typing')

        # Click bubble to skip
        typing_bubble2.click()
        page.wait_for_timeout(100)

        # Must immediately finish
        assert page.locator('.chat-bubble.agent.is-typing').count() == 0, "Bubble should finish immediately on click"
        final_bubble2 = page.locator('#chat-messages-scroll .chat-bubble.agent').last
        assert final_bubble2.locator('.typewriter-cursor').count() == 0
        assert "TS. Minh Tâm" in final_bubble2.text_content() and len(final_bubble2.text_content()) > 50
        print("Click-to-skip typewriter animation verified!")

        # Verify 0 console errors
        print("Console errors during test:", console_errors)
        assert len(console_errors) == 0, f"Expected 0 console errors, got {console_errors}"

        context.close()
        browser.close()
        print("\n>>> ALL CHECKS PASSED: Gemini model fix & Typewriter effect 100% verified! <<<")

if __name__ == '__main__':
    test_gemini_and_typewriter()
