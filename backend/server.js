import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import milkRoutes from "./routes/milk.js";
import paymentRoutes from "./routes/payments.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize & Seed Database
const seedDatabase = () => {
  const users = db.read("users");
  
  if (users.length === 0) {
    console.log("Seeding initial database...");
    
    // Seed Owner
    const owner = db.insert("users", {
      name: "Rajesh Ji (Owner)",
      phone: "9999999999",
      role: "owner",
      passcode: "123456", // plain passcode for local ease of access
    });

    // Seed Suppliers (Dudh dene wale)
    const supplier1 = db.insert("users", {
      name: "Ramesh Kumar (सप्लायर)",
      phone: "8888888888",
      role: "supplier",
      milkRateType: "fat",
      fatRate: 8.5, // 8.5 Rupees per fat point
      fixedRate: 0,
    });

    const supplier2 = db.insert("users", {
      name: "Suresh Singh (सप्लायर)",
      phone: "7777777777",
      role: "supplier",
      milkRateType: "fixed",
      fatRate: 0,
      fixedRate: 48.0, // Fixed ₹48/Liter
    });

    // Seed Customers (Dudh lene wale)
    const customer1 = db.insert("users", {
      name: "Amit Verma (ग्राहक)",
      phone: "6666666666",
      role: "customer",
      milkRateType: "fixed",
      fatRate: 0,
      fixedRate: 60.0, // Fixed ₹60/Liter
    });

    const customer2 = db.insert("users", {
      name: "Gita Patel (ग्राहक)",
      phone: "5555555555",
      role: "customer",
      milkRateType: "fixed",
      fatRate: 0,
      fixedRate: 62.0, // Fixed ₹62/Liter
    });

    // Seed some Sample Milk Records for the current month to make the 10-day cycle calculations visible
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, "0");

    // Supplier 1 milk entries (Ramesh, Fat rate 8.5)
    // Morning (Shift) milk, quantity, fat, rate, amount
    const seedRecords = [
      // Cycle 1 (Days 1-10)
      { personId: supplier1.id, name: supplier1.name, date: `${year}-${month}-02`, shift: "morning", qty: 10, fat: 6.2 },
      { personId: supplier1.id, name: supplier1.name, date: `${year}-${month}-02`, shift: "evening", qty: 9.5, fat: 6.4 },
      { personId: supplier1.id, name: supplier1.name, date: `${year}-${month}-05`, shift: "morning", qty: 11, fat: 6.0 },
      { personId: supplier1.id, name: supplier1.name, date: `${year}-${month}-05`, shift: "evening", qty: 10.5, fat: 6.1 },
      
      // Cycle 2 (Days 11-20)
      { personId: supplier1.id, name: supplier1.name, date: `${year}-${month}-12`, shift: "morning", qty: 12, fat: 6.5 },
      { personId: supplier1.id, name: supplier1.name, date: `${year}-${month}-12`, shift: "evening", qty: 11.5, fat: 6.6 },
      { personId: supplier1.id, name: supplier1.name, date: `${year}-${month}-16`, shift: "morning", qty: 10, fat: 6.3 },
      { personId: supplier1.id, name: supplier1.name, date: `${year}-${month}-16`, shift: "evening", qty: 9.0, fat: 6.2 },
      
      // Supplier 2 milk entries (Suresh, Fixed rate 48)
      { personId: supplier2.id, name: supplier2.name, date: `${year}-${month}-03`, shift: "morning", qty: 15, fat: 0 },
      { personId: supplier2.id, name: supplier2.name, date: `${year}-${month}-03`, shift: "evening", qty: 14.0, fat: 0 },
      { personId: supplier2.id, name: supplier2.name, date: `${year}-${month}-14`, shift: "morning", qty: 16.5, fat: 0 },

      // Customer 1 milk entries (Amit, Fixed rate 60)
      { personId: customer1.id, name: customer1.name, date: `${year}-${month}-04`, shift: "morning", qty: 2.0, fat: 0 },
      { personId: customer1.id, name: customer1.name, date: `${year}-${month}-04`, shift: "evening", qty: 2.0, fat: 0 },
      { personId: customer1.id, name: customer1.name, date: `${year}-${month}-15`, shift: "morning", qty: 3.0, fat: 0 },
    ];

    seedRecords.forEach((item) => {
      const isFatBased = item.fat > 0;
      const personUser = db.findOne("users", (u) => u.id === item.personId);
      const rate = isFatBased ? item.fat * personUser.fatRate : personUser.fixedRate;
      const amount = item.qty * rate;

      db.insert("records", {
        personId: item.personId,
        personName: item.name,
        date: item.date,
        shift: item.shift,
        type: personUser.role === "supplier" ? "supply" : "buy",
        quantity: item.qty,
        fat: item.fat,
        snf: isFatBased ? 8.5 : 0,
        rate: Math.round(rate * 100) / 100,
        amount: Math.round(amount * 100) / 100,
        enteredBy: owner.id,
      });
    });

    console.log("Database seeded successfully.");
  }
};

// Seed DB
seedDatabase();

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

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`MilkFlow Backend running on port ${PORT}`);
  console.log(`Owner Login Phone: 9999999999`);
  console.log(`Owner Passcode: 123456`);
  console.log(`=========================================`);
});
