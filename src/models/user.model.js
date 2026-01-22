import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, 
        lowercase: true,
    },
    phone: {
        type: String,
        required: true,
    },
    dob: {
        type: Date,
        required: true,
    },
    optionalphone: {
        type: String,
        required: false,   
    },
    country: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6, 
    },

    
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    }

}, { timestamps: true });  

const User = mongoose.model("User", userSchema);
export default User;

