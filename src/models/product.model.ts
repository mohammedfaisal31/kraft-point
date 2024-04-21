import mongoose from 'mongoose';
const Schema = mongoose.Schema;

interface IProductVariant {
    name: string;
    price: number;
    stock: number;
}

interface IProductCategory {
    _id: mongoose.Types.ObjectId;
}

export interface IAsset {
    _id: mongoose.Types.ObjectId;
}

interface IProduct extends Document {
    name: string;
    description?: string;
    slug: string;
    active: boolean;
    price: number;
    variantGroups: Array<{
        name: string;
        variants: IProductVariant[];
    }>;
    categories: IProductCategory[];
    cover: IAsset
    assets: IAsset[];
    sku: string;
    stock: number;
    sold: number;
    rating: number;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

const Product = new Schema<IProduct>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: false,
    },
    slug: {
        type: String,
        required: false,
        unique: true,
        trim: true,
        lowercase: true
    },
    active: {
        type: Boolean,
        default: true,
    },
    price: {
        type: Number,
        required: true,
    },
    variantGroups: [{
        name: {
            type: String,
            required: false,
            trim: true,
        },

        variants: [{
            name: { type: String, required: false },
            price: { type: Number, required: false },
            stock: { type: Number, required: false }
        }],
    }],
    categories: [{
        type: Schema.Types.ObjectId,
        ref: 'category',
        required: true,
    }],
    cover: {
        type: Schema.Types.ObjectId,
        ref: 'asset',
        // required: true,
    },
    assets: [{
        type: Schema.Types.ObjectId,
        ref: 'asset',
        // required: true,
    }],
    sku: {
        type: String,
        required: false,
        unique: true,
        trim: true,
        uppercase: true
    },
    stock: {
        type: Number,
        required: false,
    },
    sold: {
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0,
    },
    // reviews: [{
    //     type: Schema.Types.ObjectId,
    //     ref: 'review',
    // }],
    sortOrder: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

Product.pre(/^find/, function (next) {
    this.find()
    .populate({ path: 'assets cover', select: "url" });
    next();
});

export default mongoose.model<IProduct>('product', Product);