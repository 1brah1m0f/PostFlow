from playwright.sync_api import sync_playwright
import time
import os


class TikTokPoster:
    def __init__(self, username: str, password: str):
        self.username = username
        self.password = password

    def post(self, media_path: str, caption: str) -> tuple[bool, str]:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = context.new_page()
            try:
                page.goto("https://www.tiktok.com/login/phone-or-email/email")
                page.wait_for_load_state("networkidle")
                time.sleep(2)

                page.fill('input[name="username"]', self.username)
                page.fill('input[type="password"]', self.password)
                page.click('button[data-e2e="login-button"]')
                page.wait_for_load_state("networkidle")
                time.sleep(4)

                page.goto("https://www.tiktok.com/upload")
                page.wait_for_load_state("networkidle")
                time.sleep(3)

                page.set_input_files('input[type="file"]', media_path)
                time.sleep(6)

                caption_el = page.locator('[data-text="true"]').first
                caption_el.click()
                caption_el.fill("")
                caption_el.type(caption)
                time.sleep(1)

                page.click('button[data-e2e="post-button"]')
                page.wait_for_load_state("networkidle")
                time.sleep(3)

                return True, ""
            except Exception as e:
                return False, f"TikTok post failed: {e}"
            finally:
                browser.close()
