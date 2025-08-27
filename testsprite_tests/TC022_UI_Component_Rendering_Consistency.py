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
        # Try to focus or click on the email input field before inputting text, then input email and password, and click Sign In.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Input email 'test123@gmail.com' into the email field, input password '123456' into the password field, then click the Sign In button to test authentication.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('test123@gmail.com')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/form/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('123456')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/div/div/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Test responsiveness by resizing the browser window and verify UI components adapt correctly.
        await page.mouse.wheel(0, window.innerHeight)
        

        await page.mouse.wheel(0, -window.innerHeight)
        

        # Resize the browser window to simulate smaller screen sizes and verify responsiveness and accessibility compliance of the dashboard UI components.
        await page.mouse.wheel(0, window.innerHeight)
        

        await page.mouse.wheel(0, -window.innerHeight)
        

        # Assert the page title is correct
        assert await page.title() == 'BotrixAI - Intelligent Chatbot Platform'
        # Assert the logged in user is displayed correctly
        user_text = await page.locator('text=Ankush').text_content()
        assert user_text == 'Ankush'
        # Assert that the deployed bots count is displayed and is zero
        deployed_bots_text = await page.locator('text=0').text_content()
        assert deployed_bots_text == '0'
        # Assert that the bots list shows 'No bots yet'
        bots_list_text = await page.locator('text=No bots yet').text_content()
        assert bots_list_text == 'No bots yet'
        # Assert that the description text is present and correct
        description_text = await page.locator('text=Create intelligent chatbots to automate customer support, lead generation, and enhance user engagement on your website.').text_content()
        assert description_text == 'Create intelligent chatbots to automate customer support, lead generation, and enhance user engagement on your website.'
        # Assert that the action buttons for creating bots are present and have correct labels and links
        create_bot_button = await page.locator('text=Create a bot').first()
        assert await create_bot_button.is_visible()
        create_first_bot_button = await page.locator('text=Create Your First Bot').first()
        assert await create_first_bot_button.is_visible()
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    