// controllers/combinedMedicinesController.js

const mongoose = require("mongoose");

// 1) Model for the VIEW collection: "mediciness"
//    (image, stock, numeric price, etc.)
const medicineBasicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    prescriptionRequired: { type: Boolean, default: false },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

// Use same collection name as you already have: mediciness
const MedicineBasic =
  mongoose.models.MedicineBasic ||
  mongoose.model("MedicineBasic", medicineBasicSchema, "mediciness");

// 2) Model for the CHATBOT collection: "medicines"
//    (full medical description, uses, dosage, etc.)
const medicineDetailsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    use0: String,
    use1: String,
    use2: String,
    use3: String,
    use4: String,
    dosage: String,
    side_effects: [String],
    contraindications: [String],
    brand_name: [String],
    price: String,                // "₹50 for 10 tablets"
    delivery_time: String,
    prescription_required: Boolean,
    in_stock: Boolean,
    recommended_dosage: {
      children: String,
      adults: String,
      elderly: String,
    },
    availability: String,
    precautions: [String],
    alternativeMedicines: [String],
    manufacturer: String,
    category: String,
    rating: Number,
  },
  { timestamps: true }
);

// Use existing collection name: medicines
const MedicineDetails =
  mongoose.models.MedicineDetails ||
  mongoose.model("MedicineDetails", medicineDetailsSchema, "medicines");

/**
 * GET /api/combined-medicines/:id
 *
 * Reads:
 *   - basic doc from "mediciness" by _id  (used by card/grid)
 *   - detailed doc from "medicines" by name (used by chatbot)
 * Returns:
 *   single merged object for the details page.
 *
 * Does NOT modify any data.
 */
exports.getCombinedMedicineById = async (req, res) => {
  try {
    const id = req.params.id;

    // 1) Get basic doc (the one you already use for cards)
    const basic = await MedicineBasic.findById(id);
    if (!basic) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    // 2) Get detailed doc by name
    const nameForMatch = basic.name.trim();
    const details = await MedicineDetails.findOne({
      name: nameForMatch,
    });

    // 3) If no detailed doc, still return basic info so UI doesn’t break
    if (!details) {
      const fallback = {
        _id: basic._id,
        name: basic.name,
        category: basic.category,
        // prefer numeric price here; your details page will just show it
        price: basic.price,
        stock: basic.stock,
        prescriptionRequired: basic.prescriptionRequired,
        imageUrl: basic.imageUrl,
        in_stock: basic.stock > 0,
        availability: basic.stock > 0 ? "In Stock" : "Out of Stock",
      };
      return res.status(200).json(fallback);
    }

    // 4) Merge: card fields from basic, medical fields from details
    const combined = {
      _id: basic._id,

      // ---- card / view fields (from mediciness) ----
      imageUrl: basic.imageUrl,
      stock: basic.stock,
      prescriptionRequired: basic.prescriptionRequired,

      // ---- detailed medical fields (from medicines) ----
      name: details.name,
      description: details.description,
      use0: details.use0,
      use1: details.use1,
      use2: details.use2,
      use3: details.use3,
      use4: details.use4,
      dosage: details.dosage,
      side_effects: details.side_effects || [],
      contraindications: details.contraindications || [],
      brand_name: details.brand_name || [],
      // prefer pretty string price if present, else numeric from card
      price: details.price || `${basic.price}`,
      delivery_time: details.delivery_time,
      prescription_required:
        typeof details.prescription_required === "boolean"
          ? details.prescription_required
          : basic.prescriptionRequired,
      in_stock:
        typeof details.in_stock === "boolean"
          ? details.in_stock
          : basic.stock > 0,
      recommended_dosage: details.recommended_dosage || {},
      availability:
        details.availability ||
        (basic.stock > 0 ? "In Stock" : "Out of Stock"),
      precautions: details.precautions || [],
      alternativeMedicines: details.alternativeMedicines || [],
      manufacturer: details.manufacturer,
      category: details.category || basic.category,
      rating: details.rating,
    };

    return res.status(200).json(combined);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
