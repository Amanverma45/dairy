import express from "express";
import { db } from "../db.js";
import { authenticateToken, requireOwner } from "./middleware.js";

const router = express.Router();

router.use(authenticateToken);

// Helper to get number of days in a month
const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

// GET 10-day cycle summary for a user
// Query: personId, year, month
router.get("/cycle-summary", (req, res) => {
  const { personId, year, month } = req.query;

  if (!personId || !year || !month) {
    return res.status(400).json({ error: "personId, year, and month are required" });
  }

  // Security check: Clients can only see their own summaries
  if (req.user.role !== "owner" && req.user.id !== personId) {
    return res.status(403).json({ error: "Access denied. Cannot view other data." });
  }

  const y = parseInt(year);
  const m = parseInt(month); // 1-indexed

  // Format month to 2 digits for record checking
  const monthStr = m.toString().padStart(2, "0");
  const yearMonthPrefix = `${y}-${monthStr}`;

  // Get all records of this person in the target month
  const records = db.find(
    "records",
    (r) => r.personId === personId && r.date.startsWith(yearMonthPrefix)
  );

  // Get all logged payments for this person in the target month
  const loggedPayments = db.find(
    "payments",
    (p) => p.personId === personId && p.year === y && p.month === m
  );

  // Initialize the three 10-day cycles
  const cycles = [
    { cycle: 1, label: "Day 01 - 10", start: 1, end: 10, qty: 0, totalAmount: 0, weightedFat: 0, weightedSnf: 0, recordsCount: 0 },
    { cycle: 2, label: "Day 11 - 20", start: 11, end: 20, qty: 0, totalAmount: 0, weightedFat: 0, weightedSnf: 0, recordsCount: 0 },
    { cycle: 3, label: "Day 21 - End", start: 21, end: getDaysInMonth(y, m), qty: 0, totalAmount: 0, weightedFat: 0, weightedSnf: 0, recordsCount: 0 },
  ];

  // Distribute records into cycles
  records.forEach((r) => {
    const day = parseInt(r.date.split("-")[2]);
    const cycleIndex = day <= 10 ? 0 : day <= 20 ? 1 : 2;
    
    cycles[cycleIndex].qty += r.quantity;
    cycles[cycleIndex].totalAmount += r.amount;
    cycles[cycleIndex].weightedFat += (r.quantity * (r.fat || 0));
    cycles[cycleIndex].weightedSnf += (r.quantity * (r.snf || 0));
    cycles[cycleIndex].recordsCount += 1;
  });

  // Calculate final statistics for each cycle
  const summaries = cycles.map((c) => {
    const payment = loggedPayments.find((p) => p.cycle === c.cycle);
    
    const avgFat = c.qty > 0 ? c.weightedFat / c.qty : 0;
    const avgSnf = c.qty > 0 ? c.weightedSnf / c.qty : 0;
    const avgRate = c.qty > 0 ? c.totalAmount / c.qty : 0;

    return {
      cycle: c.cycle,
      label: c.label,
      totalQuantity: Math.round(c.qty * 100) / 100,
      totalAmount: Math.round(c.totalAmount * 100) / 100,
      avgFat: Math.round(avgFat * 100) / 100,
      avgSnf: Math.round(avgSnf * 100) / 100,
      avgRate: Math.round(avgRate * 100) / 100,
      recordsCount: c.recordsCount,
      paymentStatus: payment ? payment.status : "pending",
      paymentDate: payment ? payment.date : null,
      paymentId: payment ? payment.id : null,
      notes: payment ? payment.notes : "",
    };
  });

  return res.json(summaries);
});

// POST record payment for a cycle (Owner only)
router.post("/pay", requireOwner, (req, res) => {
  const { personId, year, month, cycle, amount, notes } = req.body;

  if (!personId || !year || !month || !cycle || amount === undefined) {
    return res.status(400).json({ error: "personId, year, month, cycle, and amount are required" });
  }

  const y = parseInt(year);
  const m = parseInt(month);
  const c = parseInt(cycle);
  const amt = Number(amount);

  // Check if a payment for this cycle already exists
  const existingPayment = db.findOne(
    "payments",
    (p) => p.personId === personId && p.year === y && p.month === m && p.cycle === c
  );

  let result;
  if (existingPayment) {
    // Update existing payment
    result = db.update("payments", existingPayment.id, {
      amount: amt,
      status: "paid",
      date: new Date().toISOString().split("T")[0],
      notes: notes || "",
    });
  } else {
    // Insert new payment
    result = db.insert("payments", {
      personId,
      year: y,
      month: m,
      cycle: c,
      amount: amt,
      status: "paid",
      date: new Date().toISOString().split("T")[0],
      notes: notes || "",
    });
  }

  return res.json({
    message: "Hisaab marked as Paid successfully",
    payment: result,
  });
});

// POST reset/unpay cycle (Owner only)
router.post("/unpay", requireOwner, (req, res) => {
  const { personId, year, month, cycle } = req.body;

  if (!personId || !year || !month || !cycle) {
    return res.status(400).json({ error: "personId, year, month, and cycle are required" });
  }

  const y = parseInt(year);
  const m = parseInt(month);
  const c = parseInt(cycle);

  const existingPayment = db.findOne(
    "payments",
    (p) => p.personId === personId && p.year === y && p.month === m && p.cycle === c
  );

  if (existingPayment) {
    db.delete("payments", existingPayment.id);
  }

  return res.json({ message: "Hisaab status reset to Pending" });
});

export default router;
