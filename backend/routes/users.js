import express from "express";
import User from "../models/User.js";
import MilkRecord from "../models/MilkRecord.js";
import Payment from "../models/Payment.js";
import { authenticateToken, requireOwner } from "./middleware.js";

const router = express.Router();

// Apply authentication restriction to all endpoints in this router
router.use(authenticateToken);

// GET all customers and suppliers (Owner only)
router.get("/", requireOwner, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "owner" } });
    
    // Calculate active/inactive status dynamically
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const lastRecord = await MilkRecord.findOne({ personId: user._id })
          .sort({ date: -1 });

        let status = "inactive";
        let lastActiveDate = null;

        if (lastRecord) {
          lastActiveDate = lastRecord.date;
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const recordDate = new Date(lastRecord.date);
          recordDate.setHours(0, 0, 0, 0);
          
          const diffTime = Math.abs(today - recordDate);
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 5) {
            status = "active";
          }
        }
        
        return {
          ...user.toJSON(),
          status,
          lastActiveDate,
        };
      })
    );

    return res.json(usersWithStatus);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Server error while fetching users" });
  }
});

// GET user by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  
  // A supplier/customer can only fetch their own profile, owner can fetch anyone
  if (req.user.role !== "owner" && req.user.id !== id) {
    return res.status(403).json({ error: "Access denied. Cannot view other profiles." });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const lastRecord = await MilkRecord.findOne({ personId: user._id })
      .sort({ date: -1 });

    let status = "inactive";
    let lastActiveDate = null;

    if (lastRecord) {
      lastActiveDate = lastRecord.date;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const recordDate = new Date(lastRecord.date);
      recordDate.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(today - recordDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 5) {
        status = "active";
      }
    }

    // Hide passcode from output
    const userObj = user.toJSON();
    delete userObj.passcode;

    return res.json({
      ...userObj,
      status,
      lastActiveDate,
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return res.status(500).json({ error: "Server error while fetching user details" });
  }
});

// POST create new supplier/customer (Owner only)
router.post("/", requireOwner, async (req, res) => {
  const { name, phone, role, milkRateType, fixedRate, fatRate, passcode, village, sno } = req.body;

  if (!name || !phone || !role) {
    return res.status(400).json({ error: "Name, phone, and role are required" });
  }

  if (role !== "supplier" && role !== "customer") {
    return res.status(400).json({ error: "Role must be either supplier or customer" });
  }

  try {
    // Check unique phone
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: "यह मोबाइल नंबर पहले से ही पंजीकृत है। (This phone number is already registered.)" });
    }

    // Auto-generate or check unique S.No.
    let finalSno = Number(sno);
    if (!sno || isNaN(finalSno)) {
      const maxSnoUser = await User.findOne({ role: { $ne: "owner" } }).sort({ sno: -1 });
      finalSno = maxSnoUser && maxSnoUser.sno ? maxSnoUser.sno + 1 : 1;
    } else {
      const duplicateSno = await User.findOne({ sno: finalSno, role: { $ne: "owner" } });
      if (duplicateSno) {
        return res.status(400).json({ error: `क्रमांक (S.No.) ${finalSno} पहले से ही किसी अन्य सदस्य को दिया हुआ है।` });
      }
    }

    const newUser = {
      name,
      phone,
      role,
      milkRateType: milkRateType || "fixed",
      fixedRate: Number(fixedRate) || 0,
      fatRate: Number(fatRate) || 0,
      passcode: passcode || "1234",
      village: village ? village.trim() : "",
      sno: finalSno,
    };

    const savedUser = await User.create(newUser);
    return res.status(201).json(savedUser);
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Server error while creating user" });
  }
});

// PUT update supplier/customer (Owner only)
router.put("/:id", requireOwner, async (req, res) => {
  const { id } = req.params;
  const { name, phone, role, milkRateType, fixedRate, fatRate, passcode, village, sno } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check unique phone if phone is updated
    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({ phone });
      if (existingUser && existingUser._id.toString() !== id) {
        return res.status(400).json({ error: "यह मोबाइल नंबर किसी अन्य यूजर के लिए पंजीकृत है। (This phone number is registered to another user.)" });
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (role !== undefined && (role === "supplier" || role === "customer")) updates.role = role;
    if (milkRateType !== undefined) updates.milkRateType = milkRateType;
    if (fixedRate !== undefined) updates.fixedRate = Number(fixedRate);
    if (fatRate !== undefined) updates.fatRate = Number(fatRate);
    if (passcode !== undefined) updates.passcode = passcode;
    if (village !== undefined) updates.village = village ? village.trim() : "";

    if (sno !== undefined) {
      const finalSno = Number(sno);
      if (!isNaN(finalSno)) {
        if (finalSno !== user.sno) {
          const duplicateSno = await User.findOne({ sno: finalSno, _id: { $ne: id } });
          if (duplicateSno) {
            return res.status(400).json({ error: `क्रमांक (S.No.) ${finalSno} पहले से ही किसी अन्य सदस्य को दिया हुआ है।` });
          }
        }
        updates.sno = finalSno;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
    return res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Server error while updating user" });
  }
});

// DELETE supplier/customer (Owner only)
router.delete("/:id", requireOwner, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Perform delete
    await User.findByIdAndDelete(id);

    // Clean up all milk records associated with this person to keep database consistent
    await MilkRecord.deleteMany({ personId: id });

    // Clean up payments
    await Payment.deleteMany({ personId: id });

    return res.json({ message: "User and associated records deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Server error while deleting user" });
  }
});

export default router;
