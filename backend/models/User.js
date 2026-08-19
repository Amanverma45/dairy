import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["owner", "supplier", "customer"],
      required: true,
    },
    passcode: {
      type: String, // Plain passcode for owner login (local/convenience)
    },
    village: {
      type: String,
      default: "",
      trim: true,
    },
    sno: {
      type: Number,
      default: null,
    },
    milkRateType: {
      type: String,
      enum: ["fixed", "fat"],
      default: "fixed",
    },
    fatRate: {
      type: Number,
      default: 0,
    },
    fixedRate: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default mongoose.model("User", userSchema);
