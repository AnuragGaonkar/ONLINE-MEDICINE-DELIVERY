const mongoose = require("mongoose");
const { Schema } = mongoose;

const medicineSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    prescriptionRequired: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String, // URL to the medicine's image
      required: true,
    },
  },
  { timestamps: true }
);

const Medicine = mongoose.model("Medicine", medicineSchema, "mediciness");
module.exports = Medicine;
