import mongoose, { Schema, Document } from "mongoose";


export interface IUser extends Document {
    name: string,
    email: string,
    password: string,
    slug: string,
    verified : boolean,
    picture : String
}

const UserSchema: Schema = new Schema({
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
    }

}, { timestamps: true })


const User = mongoose.model<IUser>('User', UserSchema);

export default User;