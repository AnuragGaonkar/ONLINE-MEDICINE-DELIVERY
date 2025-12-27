// models/MedicineDetails.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const medicineDetailsSchema = new Schema(
  {
    name: { type: String, required: true, unique: true }, // Make unique to prevent duplicates

    // Detailed info used by chatbot and details page
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

    // Updated: both string and numeric price
    price: String, // "₹30" for display
    priceNumeric: Number, // 30 for calculations/sorting

    delivery_time: String,

    prescription_required: Boolean,
    in_stock: Boolean,
    stock: { type: Number, default: 0 }, // Added stock field
    lowStock: { type: Boolean, default: false }, // Computed flag

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

    // Added imageUrl from mediciness
    imageUrl: String,
  },
  { timestamps: true }
);

// Index for better performance
medicineDetailsSchema.index({ name: 1 });
medicineDetailsSchema.index({ category: 1 });
medicineDetailsSchema.index({ lowStock: 1 });
medicineDetailsSchema.index({ in_stock: 1, stock: 1 });

const MedicineDetails = mongoose.model(
  "MedicineDetails",
  medicineDetailsSchema,
  "medicines"
);

module.exports = MedicineDetails;
