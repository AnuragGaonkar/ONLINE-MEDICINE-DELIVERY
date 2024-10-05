const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  contactNumber: {
    type: String,
    required: true,
  },
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  ],
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  cart: {
    items: [
      {
        medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
        quantity: { type: Number, required: true, min: 1 }
      }
    ],
    totalAmount: { type: Number, default: 0 }
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
