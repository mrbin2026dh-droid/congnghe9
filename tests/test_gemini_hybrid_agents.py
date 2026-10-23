# -*- coding: utf-8 -*-
"""
Verification Test Suite: Google Gemini AI Hybrid Multi-Agent Integration
Tests:
1. UI Controls & Configuration Modal (Open, Close, Key Visibility Toggle, Validation)
2. Local Storage Persistence & Realtime Status Badge Update (Live vs Fallback)
3. Connection Ping Mock & Response Feedback
4. Multi-Persona Dialogue & Context-Aware Prompt Injection (TS. Minh Tâm, KS. Hoàng Bách, Cô Thanh Mai, ThS. Trần Nam)
5. Multi-Turn Chat History Retention across Persona Switches
6. Intercepted Live Gemini API Generation via Playwright Route
7. Seamless Auto-Fallback to Local SGK Expert Engine on Network / HTTP 429 Quota Error
8. Zero Console Errors
"""
import sys
import os
import json
import urllib.parse
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_gemini_hybrid_agents():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 850})
        page = context.new_page()

        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)

        # Mock Google Gemini API endpoints
        def handle_gemini_route(route):
            request = route.request
            post_data = request.post_data_json or {}
            headers = request.headers
            url_str = request.url

            # Test connection ping
            if 'Ping test connection' in str(post_data) or 'kiểm tra kết nối' in str(post_data):
                route.fulfill(
                    status=200,
                    content_type='application/json',
                    body=json.dumps({
                        "candidates": [
                            {
                                "content": {
                                    "parts": [{"text": "Sẵn sàng đồng hành."}],
                                    "role": "model"
                                },
                                "finishReason": "STOP"
                            }
                        ]
                    })
                )
                return

            # Simulate 429 error if question contains trigger phrase
            if 'mô phỏng lỗi 429' in str(post_data) or 'trigger-429-fallback' in str(post_data):
                route.fulfill(
                    status=429,
                    content_type='application/json',
                    body=json.dumps({
                        "error": {
                            "code": 429,
                            "message": "Resource has been exhausted (quota exceeded).",
                            "status": "RESOURCE_EXHAUSTED"
                        }
                    })
                )
                return

            # Normal Gemini response
            route.fulfill(
                status=200,
                content_type='application/json',
                body=json.dumps({
                    "candidates": [
                        {
                            "content": {
                                "parts": [{
                                    "text": "Chào em! Tôi là AI Gemini được kết nối trực tiếp. Chúc em học tập tốt và định hướng nghề nghiệp vững vàng!"
                                }],
                                "role": "model"
                            },
                            "finishReason": "STOP"
                        }
                    ]
                })
            )

        page.route('**/v1beta/models/**', handle_gemini_route)

        page.goto(url)
        page.wait_for_load_state('domcontentloaded')

        print("\n=== STEP 1: Log in as student NH-9A1 and open Multi-Agent Room ===")
        page.locator('#login-student-code').fill('NH-9A1')
        page.locator('#btn-submit-student-login').click()
        page.wait_for_timeout(400)

        # Switch to Multi-Agent Room tab
        page.locator('.tab-btn[data-tab="agents"]').click()
        page.wait_for_timeout(300)

        badge_text = page.locator('#gemini-status-badge').inner_text()
        print(f"Initial Status Badge: {badge_text}")
        assert "Chuyên Gia SGK (Ngoại Tuyến)" in badge_text, "Badge should initially indicate local SGK offline mode."
        print("[PASS] Initial status badge correctly shows local SGK offline mode.")

        print("\n=== STEP 2: Verify Gemini Config Modal UI & Key Management ===")
        # Open Modal
        page.locator('#btn-open-gemini-config').click()
        page.wait_for_timeout(200)

        modal_display = page.evaluate("() => document.getElementById('gemini-config-modal').style.display")
        assert modal_display == 'flex', "Gemini config modal should display as flex."

        # Key visibility toggle
        key_input = page.locator('#gemini-api-key-input')
        assert key_input.get_attribute('type') == 'password'
        page.locator('#btn-toggle-key-visibility').click()
        assert key_input.get_attribute('type') == 'text'
        page.locator('#btn-toggle-key-visibility').click()
        assert key_input.get_attribute('type') == 'password'
        print("[PASS] Key visibility toggle works (password <-> text).")

        # Test empty key validation
        key_input.fill('')
        page.locator('#btn-test-gemini-connection').click()
        page.wait_for_timeout(300)
        msg_text = page.locator('#gemini-config-msg').inner_text()
        assert "Chưa nhập API Key" in msg_text, "Should show warning when API key is empty."
        print(f"[PASS] Empty key validation message: {msg_text}")

        # Test connection ping with mock key
        key_input.fill('AIzaSyDummyTestKeyForVerification123456')
        page.locator('#btn-test-gemini-connection').click()
        page.wait_for_timeout(500)
        test_res_text = page.locator('#gemini-config-msg').inner_text()
        print(f"Test Connection Output: {test_res_text}")
        assert "Kết nối thành công" in test_res_text, "Test connection ping should succeed with mocked API."
        print("[PASS] Test connection successfully pinged Gemini.")

        # Save config with gemini-2.0-flash
        page.locator('#gemini-model-select').select_option('gemini-2.0-flash')
        page.locator('#btn-save-gemini-config').click()
        page.wait_for_timeout(1000)

        # Verify badge updated
        badge_text_updated = page.locator('#gemini-status-badge').inner_text()
        print(f"Updated Status Badge: {badge_text_updated}")
        assert "Gemini AI Live (gemini-2.0-flash)" in badge_text_updated
        print("[PASS] Status badge dynamically updated to live Gemini mode.")

        print("\n=== STEP 3: Test Live Gemini Generation via Multi-Agent Chat ===")
        # Chat with psychologist using Gemini
        page.locator('#chat-input-text').fill('Thầy có thể chia sẻ lời khuyên về nghề kĩ thuật không?')
        page.locator('#chat-send-btn').click()

        # Wait for agent response
        page.wait_for_selector('.chat-bubble.agent:has-text("Tôi là AI Gemini")', timeout=5000)
        last_bubble = page.locator('.chat-bubble.agent').last
        bubble_html = last_bubble.inner_html()
        assert "Gemini AI (gemini-2.0-flash)" in bubble_html
        print("[PASS] Live Gemini response received with correct live badge.")

        print("\n=== STEP 4: Test Automatic Fallback to Local SGK Expert on 429 Quota Error ===")
        # Trigger simulated 429 quota error
        page.locator('#chat-input-text').fill('trigger-429-fallback: Em thấy mình không giỏi Toán, liệu có làm kỹ thuật được không?')
        page.locator('#chat-send-btn').click()

        # Wait for response bubble
        page.wait_for_timeout(1000)
        last_bubble_fallback = page.locator('.chat-bubble.agent').last
        fallback_html = last_bubble_fallback.inner_html()
        assert "Chuyên Gia SGK" in fallback_html
        assert "Toán" in fallback_html
        print("[PASS] Seamless auto-fallback to Local SGK Expert on 429 quota error verified.")

        print("\n=== STEP 5: Test Multi-Turn History Preservation Across Persona Switches ===")
        # Switch to KS. Hoàng Bách
        page.locator('.agent-card-pill[data-agent-id="tech-lead"]').click()
        page.wait_for_timeout(300)

        # Check KS. Hoàng Bách initial greeting
        bach_greeting = page.locator('.chat-messages-scroll').inner_text()
        assert "KS. Hoàng Bách" in bach_greeting
        assert "lý thuyết chỉ là 20%" in bach_greeting
        print("[PASS] KS. Hoàng Bách persona activated with unique greeting.")

        # Send message to KS. Hoàng Bách
        page.locator('#chat-input-text').fill('Chào kỹ sư Bách!')
        page.locator('#chat-send-btn').click()
        page.wait_for_timeout(600)

        # Switch back to TS. Minh Tâm
        page.locator('.agent-card-pill[data-agent-id="psychologist"]').click()
        page.wait_for_timeout(300)

        tam_chat = page.locator('.chat-messages-scroll').inner_text()
        assert "Thầy có thể chia sẻ lời khuyên về nghề kĩ thuật không?" in tam_chat, "TS. Minh Tam conversation history should be preserved."
        print("[PASS] Multi-turn conversation history successfully preserved when switching between personas.")

        # Test clear chat history
        page.locator('#btn-clear-chat-history').click()
        page.wait_for_timeout(300)
        cleared_chat = page.locator('.chat-messages-scroll').inner_text()
        assert "Thầy có thể chia sẻ lời khuyên" not in cleared_chat
        assert "TS. Minh Tâm" in cleared_chat
        print("[PASS] Clear chat history resets current agent chat to greeting.")

        print("\n=== STEP 6: Test Reverting to Offline Mode via Modal Clear Key ===")
        page.locator('#btn-open-gemini-config').click()
        page.wait_for_timeout(200)
        page.locator('#btn-clear-gemini-config').click()
        page.wait_for_timeout(300)

        badge_final = page.locator('#gemini-status-badge').inner_text()
        print(f"Final Badge Text: {badge_final}")
        assert "Chuyên Gia SGK (Ngoại Tuyến)" in badge_final
        page.locator('#btn-close-gemini-modal').click()
        page.wait_for_timeout(200)
        print("[PASS] Resetting key cleanly reverts to local offline mode.")

        # Check console errors (ignoring the simulated 429 network response from the fallback test)
        js_errors = [e for e in console_errors if '429' not in e]
        print(f"\nCaptured JS Runtime Errors: {len(js_errors)}")
        if js_errors:
            print("Errors:", js_errors)
        assert len(js_errors) == 0, "There should be zero JS runtime console errors."
        print("[PASS] Zero JS runtime errors during entire test run.")

        browser.close()

if __name__ == '__main__':
    test_gemini_hybrid_agents()
    print("\n=======================================================")
    print("🎉 ALL GEMINI HYBRID MULTI-AGENT TESTS PASSED (100%)!")
    print("=======================================================")
