import mongoose from 'mongoose';
const Schema = mongoose.Schema
import { Document } from "mongoose";

export interface ContinueWBK extends Document{
    _id: mongoose.Types.ObjectId,
    from:String,
    timestamp : Number
}

const ContinueWBK = new Schema<ContinueWBK>({
    from : {
        type:String,
        required:true
    },
    timestamp : {
        type : Number,
        required : true,
        unique : true
    }
},{collection:"continueWBK"})


export default mongoose.model<ContinueWBK>('continueWBK', ContinueWBK);
