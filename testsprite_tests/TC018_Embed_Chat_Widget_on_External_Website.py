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
        # Try to click the email input field first to focus, then input the email text. Repeat for password field, then click Sign In.
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
        

        # Navigate to the bot embed page or relevant section to copy the chat widget embed script.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/main/div/div/div/div[2]/a/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Fill in the bot creation form with required details and submit to create the bot.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/main/div/div[2]/form/div/div/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Test Chat Widget Bot')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/main/div/div[2]/form/div/div/div[3]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('A bot to test chat widget embed script functionality.')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/main/div/div[2]/form/div/div/div[4]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Hello! How can I help you today?')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/main/div/div[2]/form/div/div[2]/div/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('#1a73e8')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/main/div/div[2]/form/div/div[2]/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('https://example.com/webhook/test-webhook')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div/main/div/div[2]/form/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the 'Test Widget' button to open the embed script page.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[3]/div/div/div[2]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click the chat widget icon to open the chat interface and send a test message to verify the bot responds correctly.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Try to locate the chat input field by scrolling or extracting content, or try clicking on the chat widget area to activate the input field before sending a message.
        await page.mouse.wheel(0, window.innerHeight)
        

        # Extract the embed script from the bot embed page, then prepare a sample external web page with the embed script including customization options, and verify the widget appears and functions correctly there.
        await page.goto('http://localhost:3000/dashboard/bots/68a74b1232dda844a0eb4a20/embed', timeout=10000)
        

        # Click the 'Copy Integration Code' button to copy the embed script with customization options.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div/div[3]/div/main/div[2]/div[2]/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Navigate to the test widget page to verify the chat widget appears and operates correctly
        await page.goto('http://localhost:3000/test-widget.html?botId=68a74b1232dda844a0eb4a20', timeout=10000)
        # Wait for the chat widget script to load and initialize
        await page.wait_for_selector('iframe[src*="botrix-chat-widget"]', timeout=10000)
        chat_iframe = await page.frame_locator('iframe[src*="botrix-chat-widget"]')
        # Verify the welcome message is displayed in the chat widget
        welcome_message = await chat_iframe.locator('text=Hello! How can I help you today?').first()
        assert await welcome_message.is_visible()
        # Open the chat input field
        await chat_iframe.locator('css=button.open-chat').click()
        # Type a test message and send
        await chat_iframe.locator('css=input.chat-input').fill('Test message')
        await chat_iframe.locator('css=button.send-message').click()
        # Wait for bot response to appear
        bot_response = await chat_iframe.locator('css=.bot-message').first()
        assert await bot_response.is_visible()
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    