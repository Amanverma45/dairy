import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "milkflow_super_secret_jwt_key_123";

// Simple in-memory store for OTPs
const otpStore = {};

// Request OTP for Customer/Supplier
router.post("/request-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  try {
    // Find user by phone number
    const user = await User.findOne({ phone });
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
  } catch (error) {
    console.error("Error requesting OTP:", error);
    return res.status(500).json({ error: "Server error during OTP request" });
  }
});

// Verify OTP for Customer/Supplier
router.post("/verify-otp", async (req, res) => {
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

  try {
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Sign Token
    const token = jwt.sign(
      { id: user._id.toString(), phone: user.phone, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "30d" } // long expiry
    );

    return res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ error: "Server error during OTP verification" });
  }
});

// Owner Login via Passcode
router.post("/owner-login", async (req, res) => {
  const { name, phone, passcode } = req.body;
  if (!phone || !passcode) {
    return res.status(400).json({ error: "Phone and passcode are required" });
  }

  try {
    // Find owner by phone
    const owner = await User.findOne({ phone, role: "owner" });
    if (!owner) {
      return res.status(401).json({ error: "Invalid owner phone or account does not exist" });
    }

    // Check passcode (we use plain text passcode for local convenience)
    if (owner.passcode !== passcode) {
      return res.status(401).json({ error: "गलत पासकोड! (Incorrect passcode!)" });
    }

    // If name is provided, dynamically update the owner's name
    if (name && name.trim()) {
      owner.name = name.trim();
      await owner.save();
    }

    // Sign Token
    const token = jwt.sign(
      { id: owner._id.toString(), phone: owner.phone, role: owner.role, name: owner.name },
      JWT_SECRET,
      { expiresIn: "30d" } // keep logged in
    );

    return res.json({
      token,
      user: {
        id: owner._id.toString(),
        name: owner.name,
        phone: owner.phone,
        role: owner.role,
      },
    });
  } catch (error) {
    console.error("Error logging in owner:", error);
    return res.status(500).json({ error: "Server error during owner login" });
  }
});

// Client Login via Passcode (Customer/Supplier)
router.post("/client-login", async (req, res) => {
  const { phone, passcode } = req.body;
  if (!phone || !passcode) {
    return res.status(400).json({ error: "Phone and passcode are required" });
  }

  try {
    // Find supplier/customer by phone
    const user = await User.findOne({ phone, role: { $in: ["supplier", "customer"] } });
    if (!user) {
      return res.status(401).json({ error: "इस मोबाइल नंबर से कोई ग्राहक या सप्लायर पंजीकृत नहीं है। (No customer/supplier registered with this number.)" });
    }

    // Check passcode
    if (user.passcode !== passcode) {
      return res.status(401).json({ error: "गलत पासकोड! (Incorrect passcode!)" });
    }

    // Sign Token
    const token = jwt.sign(
      { id: user._id.toString(), phone: user.phone, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "30d" } // keep logged in
    );

    return res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error logging in client:", error);
    return res.status(500).json({ error: "Server error during client login" });
  }
});

export default router;
