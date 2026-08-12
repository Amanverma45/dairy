import express from "express";
import { db } from "../db.js";
import { authenticateToken, requireOwner } from "./middleware.js";

const router = express.Router();

// Apply owner restriction to all endpoints in this router
router.use(authenticateToken);

// GET all customers and suppliers (Owner only, though suppliers/customers can fetch their own details, but they do it via /api/auth/me or their profile route)
router.get("/", requireOwner, (req, res) => {
  const users = db.find("users", (u) => u.role !== "owner");
  return res.json(users);
});

// GET user by ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  
  // A supplier/customer can only fetch their own profile, owner can fetch anyone
  if (req.user.role !== "owner" && req.user.id !== id) {
    return res.status(403).json({ error: "Access denied. Cannot view other profiles." });
  }

  const user = db.findOne("users", (u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Hide passcode from output
  const { passcode, ...safeUser } = user;
  return res.json(safeUser);
});

// POST create new supplier/customer (Owner only)
router.post("/", requireOwner, (req, res) => {
  const { name, phone, role, milkRateType, fixedRate, fatRate } = req.body;

  if (!name || !phone || !role) {
    return res.status(400).json({ error: "Name, phone, and role are required" });
  }

  if (role !== "supplier" && role !== "customer") {
    return res.status(400).json({ error: "Role must be either supplier or customer" });
  }

  // Check unique phone
  const existingUser = db.findOne("users", (u) => u.phone === phone);
  if (existingUser) {
    return res.status(400).json({ error: "यह मोबाइल नंबर पहले से ही पंजीकृत है। (This phone number is already registered.)" });
  }

  const newUser = {
    name,
    phone,
    role,
    milkRateType: milkRateType || "fixed",
    fixedRate: Number(fixedRate) || 0,
    fatRate: Number(fatRate) || 0,
  };

  const savedUser = db.insert("users", newUser);
  return res.status(201).json(savedUser);
});

// PUT update supplier/customer (Owner only)
router.put("/:id", requireOwner, (req, res) => {
  const { id } = req.params;
  const { name, phone, role, milkRateType, fixedRate, fatRate } = req.body;

  const user = db.findOne("users", (u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Check unique phone if phone is updated
  if (phone && phone !== user.phone) {
    const existingUser = db.findOne("users", (u) => u.phone === phone);
    if (existingUser) {
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

  const updatedUser = db.update("users", id, updates);
  return res.json(updatedUser);
});

// DELETE supplier/customer (Owner only)
router.delete("/:id", requireOwner, (req, res) => {
  const { id } = req.params;

  const user = db.findOne("users", (u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Perform delete
  db.delete("users", id);

  // Clean up all milk records associated with this person to keep database consistent
  const records = db.find("records", (r) => r.personId === id);
  records.forEach((r) => db.delete("records", r.id));

  // Clean up payments
  const payments = db.find("payments", (p) => p.personId === id);
  payments.forEach((p) => db.delete("payments", p.id));

  return res.json({ message: "User and associated records deleted successfully" });
});

export default router;
