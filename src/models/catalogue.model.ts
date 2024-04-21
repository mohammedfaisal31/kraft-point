import { Schema, model } from 'mongoose';

const catalogueSchema = new Schema<ICatalogue>({
  images: [{ type: String, required: false }],
  title: { type: String, required: true },
  description: { type: String, required: true },
  websiteLink: { type: String, required: true },
  price: { type: Number, required: true },
  salePrice: { type: Number, required: true },
  facebookProductCategory: { type: String, required: false },
  condition: { type: String, required: true },
  availability: { type: Boolean, required: true },
  status: { type: Boolean, required: true },
  brand: { type: String, required: false },
  contentID: { type: Number, required: true, unique: true },
},{collection:"catalogue",timestamps:true});

interface ICatalogue {
  images: string[];
  title: string;
  description: string;
  websiteLink: string;
  price: number;
  salePrice?: number;
  facebookProductCategory?: string;
  condition: string;
  availability: boolean;
  status: Boolean;
  brand?: string;
  contentID: Number;
}

const Catalogue = model<ICatalogue>('Catalogue', catalogueSchema);

export default Catalogue;
