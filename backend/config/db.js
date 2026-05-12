import mongoose from "mongoose";

const connectDB = async() => {
try {
    await mongoose.connect(process.env.MONGO_DB);
    console.log("MongoDB connected ");
    
} catch (error) {
    console.error("Database connection Failed :" , error);
    
}
};
export default connectDB;