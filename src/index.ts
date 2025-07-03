import express from 'express';
import dotenv from "dotenv"
import { connectDb } from './configs/connectDB';
import authRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes'
import cors from 'cors';
dotenv.config()


const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true, // Allow cookies and credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow common methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow common headers
}));
connectDb();

app.get("/" , (req , res)=>{
    res.send("API working!!")
})


  app.use('/api/user', authRoutes);
  app.use('/api/product',productRoutes);




app.listen(port , ()=>{
   console.log(`Server running on  http://localhost:${port}`);
   
})
