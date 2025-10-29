from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Login
    page.goto("http://localhost:5173/#/login")
    page.get_by_placeholder("Email address").fill("admin@wsu.edu")
    page.get_by_placeholder("Password").fill("password")
    page.get_by_role("button", name="Sign in").click()

    # Navigate to Manage Users
    page.wait_for_url("http://localhost:5173/#/dashboard")
    page.get_by_role("link", name="Manage Users").click()
    page.wait_for_url("http://localhost:5173/#/admin/users")

    # Take screenshot
    page.screenshot(path="jules-scratch/verification/manage_users.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
