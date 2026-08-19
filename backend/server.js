import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "dns";
import User from "./models/User.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import milkRoutes from "./routes/milk.js";
import paymentRoutes from "./routes/payments.js";

// Set Node.js internal DNS resolution to Google DNS to bypass local ISP DNS blockages for MONGODB SRV lookup
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/milkflow";

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully.");
    seedDatabase();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Initialize & Seed Database (Only seed a default Owner if no owners exist, otherwise sync with .env)
const seedDatabase = async () => {
  try {
    const name = process.env.DEFAULT_OWNER_NAME || "Admin Owner";
    const phone = process.env.DEFAULT_OWNER_PHONE || "8435856067";
    const passcode = process.env.DEFAULT_OWNER_PASSCODE || "9754701395";

    const existingOwner = await User.findOne({ role: "owner" });
    if (!existingOwner) {
      console.log(`Seeding default owner account (${name})...`);
      await User.create({
        name,
        phone,
        role: "owner",
        passcode,
      });
      console.log("Default owner account seeded successfully.");
    } else {
      // If owner exists but credentials in .env are different, update them automatically
      if (existingOwner.name !== name || existingOwner.phone !== phone || existingOwner.passcode !== passcode) {
        console.log(`Syncing owner credentials with .env config...`);
        existingOwner.name = name;
        existingOwner.phone = phone;
        existingOwner.passcode = passcode;
        await existingOwner.save();
        console.log("Owner credentials updated successfully.");
      }
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};



// Route configuration
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/milk", milkRoutes);
app.use("/api/payments", paymentRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`=========================================`);
  console.log(`MilkFlow Backend running on port ${PORT}`);
  console.log(`Owner Login Phone: 8435856067`);
  console.log(`Owner Passcode: 9754701395`);
  console.log(`=========================================`);
});
