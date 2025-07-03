import e from "express";
import mongoose, { Schema, Document } from "mongoose";


export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    slug: string;
    verified : boolean;
    picture : String;
    role : string;
    isSuperAdmin: boolean;
}

const UserSchema: Schema<IUser> = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        select: false

    },
    slug: {
        type: String
    } ,
    verified :{
        type : Boolean,
        default : true
    },
    picture : {
        type : String
    },
    role : {
        type : String,
        default : "user",
        enum : ["user", "admin"]
    },
    isSuperAdmin: {
        type: Boolean,
        default: false,
    }

}, { timestamps: true })


const User = mongoose.model<IUser>('User', UserSchema);

export default User;