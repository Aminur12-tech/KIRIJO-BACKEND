import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 1000
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved' // Set to 'pending' if moderation is needed
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Enforce one review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Auto-populate user info
reviewSchema.virtual('user', {
    ref: 'Client',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;