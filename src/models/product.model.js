import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    price: {
        type: Number, 
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },
    fabricType: {
        type: String
    },
    region: {
        type: String
    },
    stock: {
        type: Number,
        default: 0
    },
    images: {
        type: [String],
        default: []
    }
    ,
    tags: {
        type: [String],
        default: []
    },
    featured: {
        type: Boolean,
        default: false
    }
});

// create a text index for basic search on name and description
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model("Product", productSchema);

export default Product;