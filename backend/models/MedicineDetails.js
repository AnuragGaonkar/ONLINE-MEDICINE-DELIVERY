const mongoose = require("mongoose");
const { Schema } = mongoose;

const medicineDetailsSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    description: String,
    use0: String, use1: String, use2: String, use3: String, use4: String,
    dosage: String,
    side_effects: [String],
    contraindications: [String],
    brand_name: [String],
    price: String,
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

module.exports = mongoose.model("MedicineDetails", medicineDetailsSchema, "medicines");
