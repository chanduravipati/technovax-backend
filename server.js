require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
const twilio = require("twilio");
const cors = require("cors");
const PORT = process.env.PORT || 7000;
const app = express();
app.use(cors());
app.use(express.json());

// 🔹 MongoDB Client (ONE TIME)
const mongoClient = new MongoClient(process.env.MONGO_URI);

// 🔹 Twilio Client (ONE TIME)
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

// 🔹 Connect MongoDB ONCE when server starts
let db;

async function connectMongo() {
  try {
    await mongoClient.connect();
    db = mongoClient.db(); // DB name from URI
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed", err);
    process.exit(1);
  }
}

connectMongo();

// 🔹 API: Save Feedback + Send WhatsApp
app.post("/feedback", async (req, res) => {
  try {
    const data = req.body;

    // 🔸 Basic validation
    if (
      !data.clientName ||
      !data.quality <1 ||
      !data.value <1 ||
      !data.requirement <1||
      !data.timeliness <1
    ) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    // 🔸 Store in MongoDB
    await db.collection("Clients").insertOne({
      ...data,
      createdAt: new Date()
    });

    // 🔸 Send WhatsApp Message
    await twilioClient.messages.create({
      from: "whatsapp:+14155238886", // Twilio Sandbox
      to: process.env.WHATSAPP_TO,   // Your WhatsApp number
      body: `
📩 *TechNovaX - New Feedback*

👤 Client: ${data.clientName}

⭐ Quality of Service: ${data.quality}/5
⭐ Value for Money: ${data.value}/5
⭐ Reach Your Requirement: ${data.requirement}/5
⭐ Timeliness: ${data.timeliness}/5

💬 Suggestion:
${data.suggestions || "No comments"}
`
    });

    res.json({ success: true });

  } catch (err) {
    console.error("❌ Feedback Error:", err);
    res.status(500).json({ success: false });
  }
});
app.get("/", (req, res) => {
  res.send("TechNovaX Backend Running ✅");
});

// 🔹 Start Server
app.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});
