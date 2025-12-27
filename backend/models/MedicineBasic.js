const mongoose = require("mongoose");
const { Schema } = mongoose;

const medicineBasicSchema = new Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  lowStock: { type: Boolean, default: false },
  imageUrl: String,
}, { timestamps: true });

module.exports = mongoose.model("MedicineBasic", medicineBasicSchema);
