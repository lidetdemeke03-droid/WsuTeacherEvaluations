from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:3000/login")
    page.get_by_placeholder("Email address").fill("departmenthead@test.com")
    page.get_by_placeholder("Password").fill("password")
    page.get_by_role("button", name="Sign in").click()
    page.wait_for_url("http://localhost:3000/dashboard")
    page.screenshot(path="jules-scratch/verification/verification.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
