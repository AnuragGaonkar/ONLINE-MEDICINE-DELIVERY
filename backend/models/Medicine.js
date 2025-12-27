// models/Medicine.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const medicineSchema = new Schema(
  {
    // Basic info
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
    },

    // Symptom uses for chatbot (use0–use4)
    use0: { type: String },
    use1: { type: String },
    use2: { type: String },
    use3: { type: String },
    use4: { type: String },

    // Core commerce fields
    category: {
      type: String,
      required: true,
    },
    price: {
      // store numeric version for calculations
      type: Number,
      required: true,
    },
    priceNumeric: {
      type: Number,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    in_stock: {
      type: Boolean,
      default: true,
    },

    // Extra details used by chatbot / details page
    dosage: {
      type: String,
    },
    delivery_time: {
      type: String,
    },
    side_effects: [
      {
        type: String,
      },
    ],
    contraindications: [
      {
        type: String,
      },
    ],
    brand_name: [
      {
        type: String,
      },
    ],
    prescriptionRequired: {
      type: Boolean,
      default: false,
    },
    prescription_required: {
      // kept for compatibility with existing JSON docs
      type: Boolean,
      default: false,
    },
    recommended_dosage: {
      children: { type: String },
      adults: { type: String },
      elderly: { type: String },
    },
    availability: {
      type: String,
      default: "In Stock",
    },
    precautions: [
      {
        type: String,
      },
    ],
    alternativeMedicines: [
      {
        type: String,
      },
    ],
    manufacturer: {
      type: String,
    },
    rating: {
      type: Number,
      default: 0,
    },

    // UI
    imageUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// keep in_stock in sync with stock
medicineSchema.pre("save", function (next) {
  if (typeof this.stock === "number") {
    this.in_stock = this.stock > 0;
  }
  if (this.price && !this.priceNumeric) {
    this.priceNumeric = this.price;
  }
  next();
});

medicineSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() || {};
  if (update.$inc && typeof update.$inc.stock === "number") {
    // after $inc, recompute in_stock in a follow‑up update
    this.setUpdate({
      ...update,
      $set: {
        ...(update.$set || {}),
        in_stock: { $gt: [{ $add: ["$stock", update.$inc.stock] }, 0] },
      },
    });
  }
  next();
});

const Medicine = mongoose.model("Medicine", medicineSchema, "mediciness");
module.exports = Medicine;
