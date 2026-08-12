import express from "express";
import { db } from "../db.js";
import { authenticateToken, requireOwner } from "./middleware.js";

const router = express.Router();

router.use(authenticateToken);

// GET milk records
// Query filters: personId, startDate, endDate, type
router.get("/", (req, res) => {
  const { personId, startDate, endDate, type } = req.query;

  // Security check: Clients can only see their own records
  if (req.user.role !== "owner" && req.user.id !== personId) {
    return res.status(403).json({ error: "Access denied. Cannot view other records." });
  }

  const records = db.find("records", (r) => {
    let matches = true;
    if (personId && r.personId !== personId) matches = false;
    if (type && r.type !== type) matches = false;
    if (startDate && r.date < startDate) matches = false;
    if (endDate && r.date > endDate) matches = false;
    return matches;
  });

  // Sort by date descending, then shift descending
  records.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.shift.localeCompare(a.shift);
  });

  return res.json(records);
});

// POST enter daily milk (Owner only)
router.post("/", requireOwner, (req, res) => {
  const { personId, date, shift, quantity, fat, snf } = req.body;

  if (!personId || !date || !shift || !quantity) {
    return res.status(400).json({ error: "personId, date, shift, and quantity are required" });
  }

  // Find user to get pricing model
  const person = db.findOne("users", (u) => u.id === personId);
  if (!person) {
    return res.status(404).json({ error: "Supplier/Customer not found" });
  }

  // Calculate Rate & Amount
  let rate = 0;
  const qty = Number(quantity);
  const fatVal = fat ? Number(fat) : 0;
  const snfVal = snf ? Number(snf) : 0;

  if (person.milkRateType === "fat") {
    rate = fatVal * (person.fatRate || 0);
  } else {
    rate = person.fixedRate || 0;
  }

  // Round rate to 2 decimals
  rate = Math.round(rate * 100) / 100;
  const amount = Math.round(qty * rate * 100) / 100;

  const newRecord = {
    personId,
    personName: person.name,
    date,
    shift, // 'morning' | 'evening'
    type: person.role === "supplier" ? "supply" : "buy",
    quantity: qty,
    fat: fatVal,
    snf: snfVal,
    rate,
    amount,
    enteredBy: req.user.id,
  };

  const savedRecord = db.insert("records", newRecord);
  return res.status(201).json(savedRecord);
});

// PUT update milk entry (Owner only)
router.put("/:id", requireOwner, (req, res) => {
  const { id } = req.params;
  const { date, shift, quantity, fat, snf } = req.body;

  const record = db.findOne("records", (r) => r.id === id);
  if (!record) {
    return res.status(404).json({ error: "Milk record not found" });
  }

  const person = db.findOne("users", (u) => u.id === record.personId);
  if (!person) {
    return res.status(404).json({ error: "Associated supplier/customer not found" });
  }

  const updates = {};
  if (date !== undefined) updates.date = date;
  if (shift !== undefined) updates.shift = shift;
  
  const qty = quantity !== undefined ? Number(quantity) : record.quantity;
  const fatVal = fat !== undefined ? Number(fat) : record.fat;
  const snfVal = snf !== undefined ? Number(snf) : record.snf;

  updates.quantity = qty;
  updates.fat = fatVal;
  updates.snf = snfVal;

  // Re-calculate Rate & Amount
  let rate = 0;
  if (person.milkRateType === "fat") {
    rate = fatVal * (person.fatRate || 0);
  } else {
    rate = person.fixedRate || 0;
  }

  rate = Math.round(rate * 100) / 100;
  updates.rate = rate;
  updates.amount = Math.round(qty * rate * 100) / 100;

  const updatedRecord = db.update("records", id, updates);
  return res.json(updatedRecord);
});

// DELETE milk entry (Owner only)
router.delete("/:id", requireOwner, (req, res) => {
  const { id } = req.params;
  const record = db.findOne("records", (r) => r.id === id);
  if (!record) {
    return res.status(404).json({ error: "Milk record not found" });
  }

  db.delete("records", id);
  return res.json({ message: "Milk record deleted successfully" });
});

export default router;
