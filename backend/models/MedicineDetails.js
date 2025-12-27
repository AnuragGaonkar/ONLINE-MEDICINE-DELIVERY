const mongoose = require("mongoose");

if (mongoose.models.MedicineDetails) {
  delete mongoose.models.MedicineDetails;
}

const { Schema } = mongoose;

const medicineDetailsSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
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
    price: String,
    priceNumeric: Number,
    delivery_time: String,
    prescription_required: Boolean,
    in_stock: Boolean,
    stock: { type: Number, default: 0 },
    lowStock: { type: Boolean, default: false },
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
    imageUrl: String,
  },
  { timestamps: true }
);

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
