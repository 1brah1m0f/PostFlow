from playwright.sync_api import sync_playwright
import time


class InstagramPoster:
    def __init__(self, username: str, password: str):
        self.username = username
        self.password = password

    def post(self, image_path: str, caption: str) -> bool:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            page = context.new_page()
            try:
                page.goto("https://www.instagram.com/accounts/login/")
                page.wait_for_load_state("networkidle")
                time.sleep(2)

                page.fill('input[name="username"]', self.username)
                page.fill('input[name="password"]', self.password)
                page.click('button[type="submit"]')
                page.wait_for_load_state("networkidle")
                time.sleep(3)

                page.click('svg[aria-label="New post"]')
                time.sleep(2)

                page.set_input_files('input[type="file"]', image_path)
                time.sleep(2)

                page.click('button:has-text("Next")')
                time.sleep(1)
                page.click('button:has-text("Next")')
                time.sleep(1)
                page.fill('div[aria-label="Write a caption..."]', caption)
                time.sleep(1)
                page.click('button:has-text("Share")')
                page.wait_for_load_state("networkidle")
                time.sleep(3)

                return True
            except Exception as e:
                print(f"Instagram post failed: {e}")
                return False
            finally:
                browser.close()
