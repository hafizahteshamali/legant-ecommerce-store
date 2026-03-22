import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

// Vercel serverless: cache connection across function invocations
const cached = global.mongooseCached || { conn: null, promise: null };
if (!global.mongooseCached) global.mongooseCached = cached;

const DbConnection = async () => {
    if (cached.conn) return cached.conn;
    if (!MONGODB_URI) throw new Error("MONGODB_URI is not defined in environment variables");

    try {
        cached.promise = mongoose.connect(MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
        });
        cached.conn = await cached.promise;
        console.log("Database Connected Successfully");
        return cached.conn;
    } catch (error) {
        cached.promise = null;
        console.error("Database Connection Failed:", error.message);
        throw error;
    }
};

export default DbConnection;