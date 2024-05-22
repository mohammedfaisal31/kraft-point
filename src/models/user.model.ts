import mongoose from 'mongoose';
const Schema = mongoose.Schema
import { Document } from "mongoose";

export interface IUser extends Document{
    _id: mongoose.Types.ObjectId,
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    role: string;
    oAuth: boolean;
    phone: string,
    whatsapp : Boolean,
    sessionNumber : number,
    forgotPasswordCode?: number | null,
    address?: [{
        country?: string | undefined;
        city?: string | undefined;
        street?: string | undefined;
        street2? : string | undefined;
        zipCode?: string | undefined;
    }]
}

const User = new Schema<IUser>({
    firstname: {
        type: String,
        required: false,
    },
    lastname: {
        type: String,
        required: false,
    },
    address: [{
        country: { type: String },
        city: { type: String },
        street: { type: String },
        street2 : {type:String},
        zipCode: { type: String }
    }],
    role: { type: String, default: 'customer' },
    email: {
        type: String,
        lowercase: true
    },
    password: { type: String, required: false, select: false },
    phone: {
        type: String,
        required : true
    },
    whatsapp: {
        type: Boolean,
        default : true
    },
    sessionNumber : {
        type : Number,
        default : 0
    },
    forgotPasswordCode: { type: String },
    oAuth: { type: Boolean, default: false, select: false }
},{collection:"users"})


export default mongoose.model<IUser>('users', User);
