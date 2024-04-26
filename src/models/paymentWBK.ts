import mongoose from 'mongoose';
const Schema = mongoose.Schema
import { Document } from "mongoose";

export interface PaymentWBK extends Document{
    _id: mongoose.Types.ObjectId,
    created_at : Number
}

const PaymentWBK = new Schema<PaymentWBK>({
    created_at : {
        type : Number,
        required : true,
        unique : true
    }
},{collection:"paymentWBK"})


export default mongoose.model<PaymentWBK>('paymentWBK', PaymentWBK);
