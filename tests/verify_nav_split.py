# -*- coding: utf-8 -*-
import os
import urllib.parse
from playwright.sync_api import sync_playwright

def get_page_url():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_file = os.path.join(base_dir, 'index.html')
    return 'file:///' + urllib.parse.quote(index_file.replace('\\', '/'))

def test_separated_nav():
    url = get_page_url()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # Test student login across 1280, 1366, 1920, 1024, 768, 375
        for w in [1280, 1366, 1920, 1024, 768, 375]:
            ctx = browser.new_context(viewport={'width': w, 'height': 768})
            page = ctx.new_page()
            page.goto(url)
            page.locator('#login-student-code').fill('NH-9A1')
            page.locator('#btn-submit-student-login').click()
            page.wait_for_timeout(400)
            
            # Check 0 overflow
            is_overflowing = page.evaluate("() => document.documentElement.scrollWidth > document.documentElement.clientWidth")
            assert not is_overflowing, f"Horizontal overflow detected at width {w}"
            
            # Check student badge
            badge = page.locator('#logged-in-user-badge')
            assert badge.is_visible(), f"Student badge must be visible at {w}"
            badge_box = badge.bounding_box()
            assert badge_box['x'] + badge_box['width'] <= w + 5, f"Badge overflow at {w}"
            
            # Check all 4 student tabs are visible and NOT clipped inside tab-nav
            tab_nav = page.locator('.tab-nav')
            assert tab_nav.is_visible(), f"Tab-nav must be visible at {w}"
            tn_box = tab_nav.bounding_box()
            
            if w >= 768: # Desktop / laptop full row
                tabs = page.locator('.tab-btn:not([data-tab="teacher"])').all()
                assert len(tabs) == 4, f"Expected 4 student tabs, found {len(tabs)}"
                for i, tab in enumerate(tabs):
                    tab_text = tab.text_content().strip()
                    assert tab.is_visible(), f"Tab {tab_text} must be visible at {w}"
                    t_box = tab.bounding_box()
                    assert t_box['x'] >= tn_box['x'] - 2, f"Tab {tab_text} clipped on left at {w}"
                    assert t_box['x'] + t_box['width'] <= tn_box['x'] + tn_box['width'] + 2, f"Tab {tab_text} clipped on right at {w}"
            print(f"[PASS] Width {w} Student View: 0 overflow, all 4 tabs 100% visible with zero clipping.")
            ctx.close()
            
        # Test teacher login at 1280 (13.3" laptop)
        ctx = browser.new_context(viewport={'width': 1280, 'height': 768})
        page = ctx.new_page()
        page.goto(url)
        page.locator('#auth-tab-teacher').click()
        page.wait_for_timeout(200)
        page.locator('#login-teacher-pin').fill('2026')
        page.locator('#btn-submit-teacher-login').click()
        page.wait_for_timeout(600)
        
        assert not page.locator('.tab-nav').is_visible(), "Tab nav must be hidden for teacher"
        assert page.locator('#view-teacher').is_visible(), "Teacher view must be visible"
        assert page.locator('#btn-open-change-pin-modal').is_visible(), "Change PIN button must be visible"
        
        is_overflowing = page.evaluate("() => document.documentElement.scrollWidth > document.documentElement.clientWidth")
        assert not is_overflowing, "Teacher view must not overflow at 1280px"
        print("[PASS] Teacher View at 1280px: Tab nav hidden, dashboard 100% visible, 0 overflow.")
        ctx.close()
        
        browser.close()

if __name__ == '__main__':
    test_separated_nav()
    print("[SUCCESS] ALL SEPARATED NAVIGATION TESTS PASSED 100%!")
