import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import AuthRoute from "./Routes/AuthRoutes.js";
import DbConnection from "./Database/DbConnection.js";
import productRoute from "./Routes/ProductRoutes.js";
import cartRoute from "./Routes/CartRoutes.js";
import orderRoute from "./Routes/OrderRoutes.js";
import paymentRoute from "./Routes/PaymentRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
app.use(express.json());
app.use(cors());

// Ensure DB is connected before any API request (required for Vercel serverless)
app.use("/api", async (req, res, next) => {
    try {
        await DbConnection();
        next();
    } catch (error) {
        res.status(503).json({
            success: false,
            message: "Database connection failed. Check MONGODB_URI and Atlas Network Access (0.0.0.0/0).",
        });
    }
});

app.use("/api/auth", AuthRoute);
app.use("/api/products", productRoute);
app.use("/api/cart", cartRoute);
app.use("/api/order", orderRoute);
app.use("/api/payment", paymentRoute);

const PORT = process.env.PORT || 8000;

app.get("/", (req, res)=>{
    res.status(200).send({success: 200, message: "Welcome to Backend"})
})

if (process.env.NODE_ENV !== 'production') {
    DbConnection().then(() => {
        app.listen(PORT, ()=>{
            console.log("Backend is Running on: ", PORT);
        })
    }).catch(() => {
        console.log("Starting without DB (local dev)");
        app.listen(PORT, ()=> console.log("Backend is Running on: ", PORT));
    });
}

export default app;