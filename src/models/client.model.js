import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true
    },
    name : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    }
})

const Client = mongoose.model("Client", clientSchema);

export default Client   