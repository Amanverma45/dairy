import mongoose from "mongoose";

const milkRecordSchema = new mongoose.Schema(
  {
    personId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    personName: {
      type: String,
      required: true,
    },
    date: {
      type: String, // format YYYY-MM-DD
      required: true,
    },
    shift: {
      type: String,
      enum: ["morning", "evening"],
      required: true,
    },
    type: {
      type: String,
      enum: ["supply", "buy"],
      required: true,
    },
    milkType: {
      type: String,
      enum: ["buffalo", "cow"],
      default: "buffalo",
    },
    quantity: {
      type: Number,
      required: true,
    },
    fat: {
      type: Number,
      default: 0,
    },
    snf: {
      type: Number,
      default: 0,
    },
    rate: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export default mongoose.model("MilkRecord", milkRecordSchema);
