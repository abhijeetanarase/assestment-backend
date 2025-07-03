import mongoose, { Schema, Document } from "mongoose";

interface IProduct extends Document {
    name: string;
    price: number; // Fix: should be number, not string
    category: string;
    stock: number;
    imageUrl: string;
    description: string;
    status: 'active' | 'inactive'; // Enum for status
}


const productSchems: Schema<IProduct> = new Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
    },
    imageUrl: {
        type: String,
    },
    description: {
        type: String,
        required: true,
    },
    status : {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active', // <-- Change this to 'active'
        required: true,
    }

}, { timestamps: true });

const Product = mongoose.model<IProduct>('Product', productSchems);

export default Product;