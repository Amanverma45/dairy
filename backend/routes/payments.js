import express from "express";
import MilkRecord from "../models/MilkRecord.js";
import Payment from "../models/Payment.js";
import { authenticateToken, requireOwner } from "./middleware.js";

const router = express.Router();

router.use(authenticateToken);

// Helper to get number of days in a month
const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

// GET 10-day cycle summary for a user
// Query: personId, year, month
router.get("/cycle-summary", async (req, res) => {
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

  try {
    // Get all records of this person in the target month using RegExp for startsWith behavior
    const records = await MilkRecord.find({
      personId,
      date: { $regex: `^${yearMonthPrefix}` },
    });

    // Get all logged payments for this person in the target month
    const loggedPayments = await Payment.find({
      personId,
      year: y,
      month: m,
    });

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
        paymentId: payment ? payment._id.toString() : null,
        notes: payment ? payment.notes : "",
      };
    });

    return res.json(summaries);
  } catch (error) {
    console.error("Error generating cycle summary:", error);
    return res.status(500).json({ error: "Server error while generating billing cycle summary" });
  }
});

// POST record payment for a cycle (Owner only)
router.post("/pay", requireOwner, async (req, res) => {
  const { personId, year, month, cycle, amount, notes } = req.body;

  if (!personId || !year || !month || !cycle || amount === undefined) {
    return res.status(400).json({ error: "personId, year, month, cycle, and amount are required" });
  }

  const y = parseInt(year);
  const m = parseInt(month);
  const c = parseInt(cycle);
  const amt = Number(amount);

  try {
    // Check if a payment for this cycle already exists
    const existingPayment = await Payment.findOne({
      personId,
      year: y,
      month: m,
      cycle: c,
    });

    let result;
    if (existingPayment) {
      // Update existing payment
      result = await Payment.findByIdAndUpdate(
        existingPayment._id,
        {
          amount: amt,
          status: "paid",
          date: new Date().toISOString().split("T")[0],
          notes: notes || "",
        },
        { new: true }
      );
    } else {
      // Insert new payment
      result = await Payment.create({
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
  } catch (error) {
    console.error("Error marking payment as paid:", error);
    return res.status(500).json({ error: "Server error while processing payment" });
  }
});

// POST reset/unpay cycle (Owner only)
router.post("/unpay", requireOwner, async (req, res) => {
  const { personId, year, month, cycle } = req.body;

  if (!personId || !year || !month || !cycle) {
    return res.status(400).json({ error: "personId, year, month, and cycle are required" });
  }

  const y = parseInt(year);
  const m = parseInt(month);
  const c = parseInt(cycle);

  try {
    const existingPayment = await Payment.findOne({
      personId,
      year: y,
      month: m,
      cycle: c,
    });

    if (existingPayment) {
      await Payment.findByIdAndDelete(existingPayment._id);
    }

    return res.json({ message: "Hisaab status reset to Pending" });
  } catch (error) {
    console.error("Error resetting payment status:", error);
    return res.status(500).json({ error: "Server error while resetting payment" });
  }
});

export default router;
