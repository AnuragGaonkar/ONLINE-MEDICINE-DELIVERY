// models/MedicineDetails.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

if (mongoose.models.MedicineDetails) {
  delete mongoose.models.MedicineDetails;
}

const medicineDetailsSchema = new Schema(
  {
    name: { type: String, required: true },

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

    // Here your docs store price as string: "₹50 for 10 tablets"
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

// IMPORTANT: third argument "medicines" matches your collection name
const MedicineDetails = mongoose.model(
  "MedicineDetails",
  medicineDetailsSchema,
  "medicines"
);

module.exports = MedicineDetails;
