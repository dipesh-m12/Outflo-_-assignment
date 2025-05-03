import asyncio
import nodriver as uc
from pymongo import MongoClient
from datetime import datetime

# MongoDB Configuration
MONGO_URI = "mongodb+srv://mavinash422:cCRAQrT8blgY5fWf@cluster0.bic32gr.mongodb.net/Outflo?retryWrites=true&w=majority&appName=Cluster0"
DB_NAME = "Outflo"
COLLECTION_NAME = "linkedin_profiles"

async def log(message, level="INFO"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

async def scrape_linkedin():
    # Initialize MongoDB client
    try:
        mongo_client = MongoClient(MONGO_URI)
        db = mongo_client[DB_NAME]
        collection = db[COLLECTION_NAME]
        await log("✅ MongoDB client initialized.")
    except Exception as e:
        await log(f"❌ Failed to connect to MongoDB: {e}", "ERROR")
        return

    # Launch browser with user persistence
    try:
        await log("🚀 Launching browser with user persistence...")
        browser = await uc.start(
            headless=False,  # Set to True in production
            user_data_dir="./linkedin_user_data",  # Persists cookies/sessions
            slow_mo=0.05,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox",
            ],
        )
        await log("🌐 Browser launched successfully.")
    except Exception as e:
        await log(f"❌ Browser launch failed: {e}", "ERROR")
        mongo_client.close()
        return

    try:
        # Open a new tab
        page = await browser.get("about:blank")
        await log("📄 New tab opened.")

        # LinkedIn search URL
        search_url = "https://www.linkedin.com/search/results/people/?geoUrn=%5B%22103644278%22%5D&industry=%5B%221594%22%2C%221862%22%2C%2280%22%5D&keywords=%22lead%20generation%20agency%22&origin=GLOBAL_SEARCH_HEADER&sid=z%40k&titleFreeText=Founder"

        # Navigate to LinkedIn
        await log(f"🔍 Navigating to LinkedIn search URL: {search_url}")
        await page.goto(search_url, timeout=60000)
        await log("✅ Page loaded.")

        # Check if logged in (look for the LinkedIn feed icon)
        try:
            await page.wait_for_selector("nav.global-nav", timeout=10000)
            await log("🔑 User is logged in (persistence worked).")
        except:
            await log("⚠️ Not logged in. Manual login may be required.", "WARNING")

        # Wait for dynamic content
        await log("⏳ Waiting for dynamic content (5 seconds)...")
        await asyncio.sleep(5)

        # Debug: Capture screenshot (optional)
        await page.screenshot(path="./debug_screenshot.png")
        await log("📸 Screenshot saved for debugging.")

        # Scrape profiles
        await log("🕵️‍♂️ Scraping profiles...")
        profiles = await page.evaluate(
            """
            () => {
                const results = [];
                const items = document.querySelectorAll("div.entity-result__item");
                
                items.forEach((item) => {
                    const nameElem = item.querySelector("span.entity-result__title-text a span[aria-hidden]");
                    const titleElem = item.querySelector("div.entity-result__primary-subtitle");
                    const locationElem = item.querySelector("div.entity-result__secondary-subtitle");
                    const profileUrlElem = item.querySelector("a.app-aware-link");
                    
                    results.push({
                        full_name: nameElem?.innerText.trim() || "N/A",
                        job_title: titleElem?.innerText.trim() || "N/A",
                        location: locationElem?.innerText.trim() || "N/A",
                        profile_url: profileUrlElem?.href.split('?')[0] || "N/A",  // Clean URL
                    });
                });
                return results;
            }
            """
        )

        await log(f"✅ Found {len(profiles)} profiles.")

        # Save to MongoDB
        if profiles:
            await log("💾 Saving profiles to MongoDB...")
            for profile in profiles:
                try:
                    await collection.update_one(
                        {"profile_url": profile["profile_url"]},
                        {"$set": profile},
                        upsert=True,
                    )
                except Exception as e:
                    await log(f"❌ Failed to save profile {profile['full_name']}: {e}", "WARNING")
            await log("📦 All profiles saved successfully.")
        else:
            await log("⚠️ No profiles found. Check selectors or LinkedIn structure.", "WARNING")

    except Exception as e:
        await log(f"❌ Critical error during scraping: {e}", "ERROR")
    finally:
        await log("🧹 Closing resources...")
        await browser.close()
        mongo_client.close()
        await log("🎉 Scraping session completed.")

# Run the scraper
if __name__ == "__main__":
    asyncio.run(scrape_linkedin())