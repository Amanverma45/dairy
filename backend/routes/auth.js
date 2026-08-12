import express from "express";
import jwt from "jsonwebtoken";
import { db } from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "milkflow_super_secret_jwt_key_123";

// Simple in-memory store for OTPs
const otpStore = {};

// Request OTP for Customer/Supplier
router.post("/request-otp", (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  // Find user by phone number
  const user = db.findOne("users", (u) => u.phone === phone);
  if (!user) {
    return res.status(404).json({
      error: "इस मोबाइल नंबर से कोई ग्राहक या सप्लायर पंजीकृत नहीं है। कृपया ओनर से संपर्क करें। (No customer/supplier registered with this number. Contact Owner.)",
    });
  }

  // Generate a random 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Store with a 5-minute expiry
  otpStore[phone] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000,
  };

  console.log(`[OTP DEBUG] OTP for ${phone} is: ${otp}`);

  // In production, this would trigger an SMS gateway.
  // For local testing, we return it in the response so the user can see/use it easily.
  return res.json({
    message: "OTP sent successfully",
    otp: otp, // Returned for testing convenience
  });
});

// Verify OTP for Customer/Supplier
router.post("/verify-otp", (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: "Phone and OTP are required" });
  }

  const record = otpStore[phone];
  if (!record) {
    return res.status(400).json({ error: "OTP has not been requested or has expired" });
  }

  if (Date.now() > record.expires) {
    delete otpStore[phone];
    return res.status(400).json({ error: "OTP has expired" });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP code" });
  }

  // OTP verified successfully
  delete otpStore[phone];

  const user = db.findOne("users", (u) => u.phone === phone);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Sign Token
  const token = jwt.sign(
    { id: user.id, phone: user.phone, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "30d" } // long expiry as requested: "jb tk logout na kre login hi rahe"
  );

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
    },
  });
});

// Owner Login via Passcode
router.post("/owner-login", (req, res) => {
  const { phone, passcode } = req.body;
  if (!phone || !passcode) {
    return res.status(400).json({ error: "Phone and passcode are required" });
  }

  // Find owner by phone
  const owner = db.findOne("users", (u) => u.phone === phone && u.role === "owner");
  if (!owner) {
    return res.status(401).json({ error: "Invalid owner phone or account does not exist" });
  }

  // Check passcode (we will use plain text passcode for local convenience, e.g. "123456" default)
  if (owner.passcode !== passcode) {
    return res.status(401).json({ error: "गलत पासकोड! (Incorrect passcode!)" });
  }

  // Sign Token
  const token = jwt.sign(
    { id: owner.id, phone: owner.phone, role: owner.role, name: owner.name },
    JWT_SECRET,
    { expiresIn: "30d" } // keep logged in
  );

  return res.json({
    token,
    user: {
      id: owner.id,
      name: owner.name,
      phone: owner.phone,
      role: owner.role,
    },
  });
});

export default router;
