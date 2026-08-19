import express from "express";
import User from "../models/User.js";
import MilkRecord from "../models/MilkRecord.js";
import { authenticateToken, requireOwner } from "./middleware.js";

const router = express.Router();

router.use(authenticateToken);

// GET milk records
// Query filters: personId, startDate, endDate, type
router.get("/", async (req, res) => {
  const { personId, startDate, endDate, type } = req.query;

  // Security check: Clients can only see their own records
  if (req.user.role !== "owner" && req.user.id !== personId) {
    return res.status(403).json({ error: "Access denied. Cannot view other records." });
  }

  try {
    const filter = {};
    if (personId) filter.personId = personId;
    if (type) filter.type = type;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    // Fetch and sort by date descending, then shift descending
    // Note: sorting shift descending ('morning' vs 'evening', 'morning' comes before 'evening' alphabetically,
    // but we want 'evening' first in list or 'morning' first? The original code sorted shift desc:
    // b.shift.localeCompare(a.shift) which means 'morning' is compared with 'evening' and sorted descending,
    // so 'morning' comes after 'evening' because 'm' comes before 'v' / 'e' alphabetically? Let's check:
    // 'evening' (e) vs 'morning' (m). 'm' > 'e'. So desc sort means 'morning' then 'evening'.
    // In Mongoose sort, we can sort by date descending and shift descending/ascending.
    const records = await MilkRecord.find(filter).sort({ date: -1, shift: -1 });

    return res.json(records);
  } catch (error) {
    console.error("Error fetching milk records:", error);
    return res.status(500).json({ error: "Server error while fetching milk records" });
  }
});

// POST enter daily milk (Owner only)
router.post("/", requireOwner, async (req, res) => {
  const { personId, date, shift, quantity, fat, snf, milkType } = req.body;

  if (!personId || !date || !shift || !quantity) {
    return res.status(400).json({ error: "personId, date, shift, and quantity are required" });
  }

  try {
    // Find user to get pricing model
    const person = await User.findById(personId);
    if (!person) {
      return res.status(404).json({ error: "Supplier/Customer not found" });
    }

    // Calculate Rate & Amount
    let rate = 0;
    const qty = Number(quantity);
    const fatVal = fat ? Number(fat) : 0;
    const snfVal = snf ? Number(snf) : 0;
    const mType = milkType || "buffalo";

    if (person.role === "customer") {
      if (mType === "cow") {
        rate = 45; // Cow milk default rate
      } else {
        rate = person.fixedRate || 65; // Buffalo milk default rate (custom fixedRate or 65)
      }
    } else {
      // For suppliers
      if (person.milkRateType === "fat") {
        rate = fatVal * (person.fatRate || 0);
      } else {
        rate = person.fixedRate || 0;
      }
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
      milkType: mType,
      quantity: qty,
      fat: fatVal,
      snf: snfVal,
      rate,
      amount,
      enteredBy: req.user.id,
    };

    const savedRecord = await MilkRecord.create(newRecord);
    return res.status(201).json(savedRecord);
  } catch (error) {
    console.error("Error entering milk record:", error);
    return res.status(500).json({ error: "Server error while recording milk entry" });
  }
});

// PUT update milk entry (Owner only)
router.put("/:id", requireOwner, async (req, res) => {
  const { id } = req.params;
  const { date, shift, quantity, fat, snf } = req.body;

  try {
    const record = await MilkRecord.findById(id);
    if (!record) {
      return res.status(404).json({ error: "Milk record not found" });
    }

    const person = await User.findById(record.personId);
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

    const updatedRecord = await MilkRecord.findByIdAndUpdate(id, updates, { new: true });
    return res.json(updatedRecord);
  } catch (error) {
    console.error("Error updating milk record:", error);
    return res.status(500).json({ error: "Server error while updating milk record" });
  }
});

// DELETE milk entry (Owner only)
router.delete("/:id", requireOwner, async (req, res) => {
  const { id } = req.params;

  try {
    const record = await MilkRecord.findById(id);
    if (!record) {
      return res.status(404).json({ error: "Milk record not found" });
    }

    await MilkRecord.findByIdAndDelete(id);
    return res.json({ message: "Milk record deleted successfully" });
  } catch (error) {
    console.error("Error deleting milk record:", error);
    return res.status(500).json({ error: "Server error while deleting milk record" });
  }
});

export default router;
