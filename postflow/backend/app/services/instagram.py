from playwright.sync_api import sync_playwright
import time
import re


def _dismiss_popup(page, selector: str, timeout: int = 3000):
    try:
        page.click(selector, timeout=timeout)
    except Exception:
        pass


def _login(page, username: str, password: str) -> tuple[bool, str]:
    try:
        page.goto("https://www.instagram.com/accounts/login/")
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        _dismiss_popup(page, 'button:has-text("Allow all cookies")')
        time.sleep(1)
        page.fill('input[name="username"]', username)
        page.fill('input[name="password"]', password)
        page.click('button[type="submit"]')
        page.wait_for_load_state("networkidle")
        time.sleep(3)
    except Exception as e:
        return False, f"Login navigation failed: {e}"

    if "accounts/login" in page.url:
        try:
            error_el = page.locator("#slfErrorAlert").first
            if error_el.is_visible(timeout=2000):
                return False, f"Login rejected: {error_el.text_content()}"
        except Exception:
            pass
        try:
            if page.locator('text="Suspicious Login Attempt"').is_visible(timeout=2000):
                return False, "Login blocked: Instagram flagged this as a suspicious login attempt"
        except Exception:
            pass
        try:
            if page.locator('input[name="verificationCode"]').is_visible(timeout=2000):
                return False, "Login failed: two-factor authentication is required but not supported"
        except Exception:
            pass
        return False, "Login failed: wrong credentials or account blocked"

    _dismiss_popup(page, 'button:has-text("Not Now")')
    time.sleep(1)
    _dismiss_popup(page, 'button:has-text("Not Now")')
    time.sleep(0.5)
    return True, ""


def get_instagram_profile(username: str, password: str) -> dict:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = context.new_page()
        try:
            success, error = _login(page, username, password)
            if not success:
                return {"error": error}

            page.goto(f"https://www.instagram.com/{username}/")
            page.wait_for_load_state("networkidle")
            time.sleep(2)

            og_title = page.locator('meta[property="og:title"]').get_attribute("content") or ""
            og_desc = page.locator('meta[property="og:description"]').get_attribute("content") or ""
            og_image = page.locator('meta[property="og:image"]').get_attribute("content") or ""

            full_name = ""
            if "(@" in og_title:
                full_name = og_title.split("(@")[0].strip()
            else:
                full_name = og_title.strip()

            follower_count = following_count = post_count = 0
            m = re.search(r"([\d,]+)\s+Followers?", og_desc)
            if m:
                follower_count = int(m.group(1).replace(",", ""))
            m = re.search(r"([\d,]+)\s+Following", og_desc)
            if m:
                following_count = int(m.group(1).replace(",", ""))
            m = re.search(r"([\d,]+)\s+Posts?", og_desc)
            if m:
                post_count = int(m.group(1).replace(",", ""))

            return {
                "full_name": full_name,
                "username": username,
                "profile_pic_url": og_image,
                "follower_count": follower_count,
                "following_count": following_count,
                "post_count": post_count,
            }
        except Exception as e:
            return {"error": str(e)}
        finally:
            browser.close()


class InstagramPoster:
    def __init__(self, username: str, password: str):
        self.username = username
        self.password = password

    def post(self, image_path: str, caption: str) -> tuple[bool, str]:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            page = context.new_page()
            try:
                success, error = _login(page, self.username, self.password)
                if not success:
                    return False, error

                try:
                    page.click('svg[aria-label="New post"]')
                    time.sleep(2)
                except Exception as e:
                    return False, f"Could not find 'New post' button: {e}"

                try:
                    page.set_input_files('input[type="file"]', image_path)
                    time.sleep(2)
                except Exception as e:
                    return False, f"Image upload failed: {e}"

                try:
                    page.click('button:has-text("Next")')
                    time.sleep(1)
                except Exception as e:
                    return False, f"Crop step 'Next' button failed: {e}"

                try:
                    page.click('button:has-text("Next")')
                    time.sleep(1)
                except Exception as e:
                    return False, f"Filter step 'Next' button failed: {e}"

                try:
                    page.fill('div[aria-label="Write a caption..."]', caption)
                    time.sleep(1)
                except Exception as e:
                    return False, f"Writing caption failed: {e}"

                try:
                    page.click('button:has-text("Share")')
                    page.wait_for_load_state("networkidle")
                    time.sleep(3)
                except Exception as e:
                    return False, f"Share button failed: {e}"

                return True, ""
            except Exception as e:
                return False, f"Unexpected error: {e}"
            finally:
                browser.close()
