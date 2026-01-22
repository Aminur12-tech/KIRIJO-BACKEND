import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    priceAtPurchase: {
        type: Number,
        required: true
    }
});

const orderStatusEnum = ["placed", "processing", "shipped", "delivered", "cancelled"];

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: orderStatusEnum,
        default: "placed"
    },
    paymentMode: {
        type: String,
        enum: ["COD", "Online"],
        required: true
    },
    history: [
        {
            status: {
                type: String,
                enum: orderStatusEnum
            },
            changedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true });


const Order = mongoose.model("Order", orderSchema);
export default Order;