// models/Order.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderMedicineSchema = new Schema({
  medicineId: {
    type: Schema.Types.ObjectId,
    ref: "Medicine",            // <<< IMPORTANT CHANGE
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
});

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    medicines: [orderMedicineSchema],
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: "PLACED",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
