import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    type: { type: String, enum: ["percent", "fixed", "free_shipping"], required: true },
    value: { type: Number, required: true }, // percent (0-100) or fixed amount
    appliesToProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    appliesToCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    minOrderValue: { type: Number, default: 0 },
    startsAt: { type: Date, default: Date.now },
    endsAt: { type: Date },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    maxUsesPerUser: { type: Number, default: 1 },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Client" }
}, { timestamps: true });

// Helper to check active and in-range
promotionSchema.methods.isActive = function () {
    if (!this.active) return false;
    const now = new Date();
    if (this.startsAt && now < this.startsAt) return false;
    if (this.endsAt && now > this.endsAt) return false;
    if (this.usageLimit && this.usageLimit > 0 && this.usedCount >= this.usageLimit) return false;
    return true;
};

const Promotion = mongoose.model("Promotion", promotionSchema);
export default Promotion;
