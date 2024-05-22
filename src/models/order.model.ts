import mongoose from 'mongoose';
const Schema = mongoose.Schema
import { Document } from "mongoose";

enum Role {
    CARD = 'card',
    CASH = 'cash',
    UPI = 'upi',
    NET = 'net'
}

enum PaymentStatus {
    PEDNING = 'pending',
    COMPLETED = 'completed'
}

enum Status {
    ACTIVE = 'active',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}
interface IOrder extends Document {
    customer: mongoose.Types.ObjectId,
    total: number,
    currency: string,
    payment: Role,
    paymentStatus : PaymentStatus,
    status : Status,
    paymentRequestID : string,
    paymentID:string,
    paymentLink:string,
    customerDetails: {
        firstName : {type:String},
        lastName : {type:String},
        email : {type:String},
        phone : {type:String},
    },
    billingAndShippingSame : Boolean,
    billingAddress:{
            country: { type: String , default : "INDIA"},
            city: { type: String },
            street1: { type: String },
            street2 : {type:String},
            landmark : {type:String},
            state : {type:String},
            pincode: { type: String }
        
    },
    shippingAddress:{
        country: { type: String , default : "INDIA"},
        city: { type: String },
        street1: { type: String },
        street2 : {type:String},
        landmark : {type:String},
        state : {type:String},
        pincode: { type: String }
    
    },
    items: {
        productID: Number,
        price: number,
        currency: 'inr',
        qty: number
    }[],
    createdAt : Date,
    updatedAt : Date
}

const Order = new Schema<IOrder>({
    customer: mongoose.Types.ObjectId,
    total: Number,
    currency: String,
    payment: {
        type: String,
        enum: Role,
        default: Role.UPI
    },
    paymentStatus : {
        type : String,
        enum : PaymentStatus,
        default : PaymentStatus.PEDNING
    },
    status : {
        type : String,
        enum : Status,
        default : Status.ACTIVE
    },
    paymentRequestID : {
        type : String,
        required:false
    },
    paymentID : {
        type : String,
        required:false
    },
    paymentLink : {
        type : String,
        required:false
    },
    customerDetails: Object,
    billingAddress : Object,
    shippingAddress : Object,
    billingAndShippingSame : {
        type : Boolean,
        default : true
    },
    items: [{
        productID: Number,
        price: Number,
        currency: { type: String, default: 'inr' },
        qty: Number
    }]
},{timestamps:true})

export default mongoose.model<IOrder>('Order', Order)