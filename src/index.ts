import express from 'express';
import dotenv from "dotenv"
import { connectDb } from './configs/connectDB';
dotenv.config()


const app = express();
const port = process.env.PORT || 3000;

app.get("/" , (req , res)=>{
    res.send("API working!!")
})

connectDb();


app.listen(port , ()=>{
   console.log(`Server running on  http://localhost:${port}`);
   
})
