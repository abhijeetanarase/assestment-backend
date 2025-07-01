import { connect } from "mongoose";


export const connectDb = async (): Promise<void> => {
    try {
        await connect(process.env.MONGO_URI as string).then(() => {
         console.log("MongoDb connected"); })
     } catch (error) {
        console.log(error);
     }
}