// models/Order.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderMedicineSchema = new Schema({
  medicineId: {
    type: Schema.Types.ObjectId,
    ref: "Medicine",
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
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      default: "Pending",
    },
    deliveryStatus: {
      type: String,
      default: "Processing",
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
