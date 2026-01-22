import mongoose from "mongoose";

export const connectDB = async (MONGO_URI) => {
    try {
        const connection = await mongoose.connect(MONGO_URI)
        console.log(`Database connected successfully ${connection.connection.host}`)
    } catch (error) {
        console.error("Error Connecting to Database ", error.message)
    }
}