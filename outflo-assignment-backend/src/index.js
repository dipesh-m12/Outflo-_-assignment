const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const MONGODB_URI =
  "mongodb+srv://mavinash422:cCRAQrT8blgY5fWf@cluster0.bic32gr.mongodb.net/Outflo?retryWrites=true&w=majority&appName=Cluster0";
const GEMINI_API_KEY = "AIzaSyDsbc83QHGBwJbdy-0yduRCKvQv6w_x05E";

// MongoDB Campaign Schema
const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "DELETED"],
      default: "ACTIVE",
    },
    leads: [{ type: String }],
    accountIDs: [{ type: String }],
  },
  { timestamps: true }
);

const Campaign = mongoose.model("Campaign", campaignSchema);

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware for error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    res.status(500).json({
      message: "Server error",
      data: null,
      success: false,
      error: err.message,
    });
  });
};

app.get("/", (req, res) => {
  res.send("OutFlo server running...");
});

// Campaign CRUD APIs
app.get(
  "/campaigns",
  asyncHandler(async (req, res) => {
    const campaigns = await Campaign.find({ status: { $ne: "DELETED" } });
    res.json({
      message: "Campaigns fetched successfully",
      data: campaigns,
      success: true,
      error: null,
    });
  })
);

app.get(
  "/campaigns/:id",
  asyncHandler(async (req, res) => {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign || campaign.status === "DELETED") {
      return res.status(404).json({
        message: "Campaign not found",
        data: null,
        success: false,
        error: "Campaign does not exist or is deleted",
      });
    }
    res.json({
      message: "Campaign fetched successfully",
      data: campaign,
      success: true,
      error: null,
    });
  })
);

app.post(
  "/campaigns",
  asyncHandler(async (req, res) => {
    const { name, description, status, leads, accountIDs } = req.body;
    if (!name || !description) {
      return res.status(400).json({
        message: "Name and description are required",
        data: null,
        success: false,
        error: "Missing required fields",
      });
    }
    const campaign = new Campaign({
      name,
      description,
      status: status || "ACTIVE",
      leads: leads || [],
      accountIDs: accountIDs || [],
    });
    await campaign.save();
    res.status(201).json({
      message: "Campaign created successfully",
      data: campaign,
      success: true,
      error: null,
    });
  })
);

app.put(
  "/campaigns/:id",
  asyncHandler(async (req, res) => {
    const { name, description, status, leads, accountIDs } = req.body;
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign || campaign.status === "DELETED") {
      return res.status(404).json({
        message: "Campaign not found",
        data: null,
        success: false,
        error: "Campaign does not exist or is deleted",
      });
    }
    campaign.name = name || campaign.name;
    campaign.description = description || campaign.description;
    campaign.status = status || campaign.status;
    campaign.leads = leads || campaign.leads;
    campaign.accountIDs = accountIDs || campaign.accountIDs;
    await campaign.save();
    res.json({
      message: "Campaign updated successfully",
      data: campaign,
      success: true,
      error: null,
    });
  })
);

app.delete(
  "/campaigns/:id",
  asyncHandler(async (req, res) => {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign || campaign.status === "DELETED") {
      return res.status(404).json({
        message: "Campaign not found",
        data: null,
        success: false,
        error: "Campaign does not exist or is already deleted",
      });
    }
    campaign.status = "DELETED";
    await campaign.save();
    res.json({
      message: "Campaign deleted successfully",
      data: null,
      success: true,
      error: null,
    });
  })
);

// LinkedIn Personalized Message API
app.post(
  "/personalizedmessage",
  asyncHandler(async (req, res) => {
    const { name, job_title, company, location, summary } = req.body;
    if (!name || !job_title || !company) {
      return res.status(400).json({
        message: "Name, job title, and company are required",
        data: null,
        success: false,
        error: "Missing required fields",
      });
    }

    const prompt = `You are an expert sales outreach specialist. Craft a personalized LinkedIn outreach message for ${name}, a ${job_title} at ${company} in ${location}. Their summary: ${
      summary || "N/A"
    }. Promote OutFlo, an AI-powered outreach tool that helps sales teams automate personalized campaigns and book 2-3x more meetings. Use a friendly, professional tone, referencing their role and company to build rapport. Keep the message concise (50-80 words), engaging, and include a clear call-to-action to schedule a quick demo. Avoid generic phrases and ensure the message feels authentic.`;

    try {
      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
        {
          contents: [{ parts: [{ text: prompt }] }],
        },
        {
          headers: { "Content-Type": "application/json" },
          params: { key: GEMINI_API_KEY },
        }
      );

      const message = response.data.candidates[0].content.parts[0].text;

      res.json({
        message: "Personalized message generated successfully",
        data: { message },
        success: true,
        error: null,
      });
    } catch (err) {
      res.status(500).json({
        message: "Failed to generate message",
        data: null,
        success: false,
        error: err.message,
      });
    }
  })
);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
