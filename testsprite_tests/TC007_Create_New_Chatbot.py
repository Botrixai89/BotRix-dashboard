import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:3000", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # Try inputting email and password using alternative input method or verify element properties.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('test123@gmail.com')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/form/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/form/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('123456')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Create Your First Bot' button to navigate to the bot creation page.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div[2]/a/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Fill in the bot name, description, welcome message, webhook URL, and optionally upload a logo and set primary color, then submit the form by clicking 'Create Bot'.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/main/div/div[2]/form/div/div/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Test Support Bot')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/main/div/div[2]/form/div/div/div[3]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('A chatbot to assist customers with support queries.')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/main/div/div[2]/form/div/div/div[4]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Hello! How can I assist you today?')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/main/div/div[2]/form/div/div[2]/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('https://your-automation.com/webhook/test-support-bot')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/main/div/div[2]/form/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assert that the new bot is listed with the correct name on the dashboard
        bot_name_locator = frame.locator('xpath=//div[contains(text(), "Test Support Bot")]')
        assert await bot_name_locator.is_visible(), "New bot name 'Test Support Bot' is not visible on the dashboard"
          
        # Assert that the page title is correct
        assert (await page.title()) == "BotrixAI - Intelligent Chatbot Platform", "Page title does not match expected title"
          
        # Assert that the overview section contains expected keys and values
        overview_section = {
            "Total Conversations": 0,
            "New Messages (24h)": 0,
            "Avg. Response Time": "N/A",
            "Handover Rate": "0%"
        }
        for key, expected_value in overview_section.items():
            overview_locator = frame.locator(f'xpath=//section[contains(., "Overview")]//text()[contains(., "{key}")]/..')
            text_content = await overview_locator.text_content()
            assert text_content is not None and str(expected_value) in text_content, f"Overview section key '{key}' does not have expected value '{expected_value}'"
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    