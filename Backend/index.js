import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import AuthRoute from "./Routes/AuthRoutes.js";
import DbConnection from "./Database/DbConnection.js";
import productRoute from "./Routes/ProductRoutes.js";
import cartRoute from "./Routes/CartRoutes.js";
import orderRoute from "./Routes/OrderRoutes.js";
import paymentRoute from "./Routes/PaymentRoutes.js";

const app = express();

dotenv.config();
app.use(express.json());
app.use(cors());

app.use("/api/auth", AuthRoute);
app.use("/api/products", productRoute);
app.use("/api/cart", cartRoute);
app.use("/api/order", orderRoute);
app.use("/api/payment", paymentRoute);

const PORT = process.env.PORT;

app.get("/", (req, res)=>{
    res.status(200).send({success: 200, message: "Welcome to Backend"})
})

DbConnection();

app.listen(PORT, ()=>{
    console.log("Backend is Running on: ", PORT);
})