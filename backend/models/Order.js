const mongoose = require("mongoose");
const { Schema } = mongoose;

const OrderSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    medicines: [
      {
        medicineId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Medicine", // Reference to the Medicine model
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },
    deliveryStatus: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Processing",
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
