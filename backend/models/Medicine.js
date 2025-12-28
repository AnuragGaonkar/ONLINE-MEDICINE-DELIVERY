const mongoose = require("mongoose");
const { Schema } = mongoose;

const medicinessSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    prescriptionRequired: { type: Boolean, default: false },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

// Auto-update in_stock based on stock
medicinessSchema.virtual('in_stock').get(function() {
  return this.stock > 0;
});

module.exports = mongoose.model("Mediciness", medicinessSchema, "mediciness");
