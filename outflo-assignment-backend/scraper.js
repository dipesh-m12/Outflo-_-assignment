const puppeteer = require("puppeteer");
const { MongoClient } = require("mongodb");

const mongoUri =
  "mongodb+srv://mavinash422:cCRAQrT8blgY5fWf@cluster0.bic32gr.mongodb.net/Outflo?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(mongoUri);
const dbName = "Outflo";

const scrapeLinkedIn = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./user_data",
    defaultViewport: null,
    dumpio: true, // 🐞 Log browser output to terminal
    slowMo: 50, // 🐢 Slow down actions (optional for debugging)
    args: [
      "--disable-blink-features=AutomationControlled", // 🕵️‍♂️ Less detectable
    ],
  });

  const page = await browser.newPage();
  const searchUrl =
    "https://www.linkedin.com/search/results/people/?geoUrn=%5B%22103644278%22%5D&industry=%5B%221594%22%2C%221862%22%2C%2280%22%5D&keywords=%22lead%20generation%20agency%22&origin=GLOBAL_SEARCH_HEADER&sid=z%40k&titleFreeText=Founder";

  try {
    console.log("Step 0: Going to search URL...");
    await page.goto(searchUrl, { timeout: 60000 });
    console.log("Step 1: Page loaded.");

    // Wait for 5 seconds using setTimeout workaround
    await new Promise((resolve) => setTimeout(resolve, 5000)); // wait 5 seconds
    console.log("Step 2: Waited for 5 seconds.");

    // Try to find the specific div by id
    const specificDiv = await page.$("div[id='#/fx/nty+TdqV64UxDP81WA==']");
    if (specificDiv) {
      console.log("Step 3: Found div with id #/fx/nty+TdqV64UxDP81WA==.");
      const divContent = await page.evaluate((el) => el.innerHTML, specificDiv);
      console.log("Div content:", divContent); // Log the content of the specific div
    } else {
      console.log("Step 3: Div with id #/fx/nty+TdqV64UxDP81WA== not found.");
    }

    // You can also try to wait for the specific div with this exact id
    await page.waitForSelector("div[id='#/fx/nty+TdqV64UxDP81WA==']", {
      timeout: 15000,
    });
    console.log(
      "Step 4: Found specific div with id #/fx/nty+TdqV64UxDP81WA==."
    );

    // Proceed with scraping profiles
    const profiles = await page.evaluate(() => {
      const container = document.querySelector("div[id^='#/fx/']");
      if (!container) return [];

      const items = container.querySelectorAll("div > ul > li");

      return Array.from(items).map((li) => {
        const name =
          li.querySelector("span[aria-hidden='true']")?.innerText || "N/A";
        const title =
          li.querySelector("div.t-14.t-black.t-normal")?.innerText || "N/A";
        const location =
          li.querySelector("div.t-14.t-normal:nth-of-type(2)")?.innerText ||
          "N/A";
        const profileUrl =
          li.querySelector("a.nuXDIvMbeMYWApPugutCOKmVhZzvTYUM")?.href || "N/A";

        return {
          full_name: name.trim(),
          job_title: title.trim(),
          location: location.trim(),
          profile_url: profileUrl.trim(),
        };
      });
    });

    console.log("✅ Scraped Profiles:", profiles.length);

    // Save to MongoDB
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("linkedin_profiles");

    for (const profile of profiles) {
      await collection.updateOne(
        { profile_url: profile.profile_url },
        { $set: profile },
        { upsert: true }
      );
    }

    console.log("📦 Profiles saved to MongoDB.");
  } catch (err) {
    console.error("❌ Error during scraping:", err);
  } finally {
    await client.close();
    await browser.close();
  }
};

scrapeLinkedIn();
