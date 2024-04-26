import envConfig from "../config";
import Razorpay from "razorpay";
import Order from "../models/order.model";
import axios from "axios";
import Catalogue from "../models/catalogue.model";
import User from "../models/user.model";

const instance = new Razorpay({
    key_id: envConfig.razorpay.key_id,
    key_secret: envConfig.razorpay.secret_id
});

const whatsappAcessToken = envConfig.whatsapp.access_token
const url = envConfig.whatsapp.graph_uri;
const headers = {
  'Authorization': `Bearer ${whatsappAcessToken}`,
  'Content-Type': 'application/json'
};

const shiprocketToken = envConfig.shiprocket.token;

export async function createPaymentOrder(order:any):Promise<Object | null>{
        
    try{
        var created_payment_link = await instance.paymentLink.create({
          amount: order["total"]*100, //paisa
          currency: "INR",
          accept_partial: false,
          description: "Kraft Point Products",
          customer: {
            name: `${order["customerDetails"]["firstName"]} ${order["customerDetails"]["lastName"]} `,
            email: order["customerDetails"]["email"],
            contact: `+${order["customerDetails"]["phone"]}`
          },
          notify: {
            sms: true,
            email: true
          },
          reminder_enable: true,
          notes: {
            order: "Kaft Point Products",
            order_id : order["_id"]
          },
          callback_url: "https://wa.me/919739469147",
          callback_method: "get"
        })
        if(created_payment_link){
            console.log(created_payment_link)
            return created_payment_link
        }else{
            return null
        }
    }catch(err){
        console.error(err)
        return null
    }
    
        

}


// Assuming you have the Shiprocket token


export async function handlePaymentCapturedEvent(payload: any): Promise<boolean> {
    const { payment } = payload;
    const { notes } = payment.entity;

    const updatedOrder: any = await Order.findByIdAndUpdate(
        { _id: notes.order_id },
        { $set: { paymentStatus: "completed", status: "processing" } },
        { new: true }
    );
    console.log(updatedOrder)

    const user :any = await User.findOne({phone:`91${updatedOrder["customerDetails"]["phone"]}`})

    if(user["sessionNumber"] == 5){
        // Create Shiprocket order
    try {
        const shiprocketOrder = await createShiprocketOrder(updatedOrder);
        console.log("Shiprocket order created:", shiprocketOrder);
    } catch (error) {
        console.error("Error creating Shiprocket order:", error);
        return false;
    }

    const linkedUser = await User.findOne({phone:`91${updatedOrder["customerDetails"]["phone"]}`})
    console.log(linkedUser)

    // Prepare WhatsApp message payload with a stylish timeline
    const whatsappMessage = `
        Your payment has been successfully captured!
        Below is the timeline of your order..
        ------------------------------------
        *ORDER:CREATED -> ORDER:PROCESSING*
        ------------------------------------
    `;

    const whatsappPayload = {
        messaging_product: "whatsapp",
        recipient_type: 'individual',
        to: `91${updatedOrder["customerDetails"]["phone"]}`,
        type: 'interactive',
        interactive: {
            type: 'order_status',
            body: {
                text: whatsappMessage
            },
            action: {
                name: 'review_order',
                parameters: {
                    reference_id: notes.order_id,
                    order: {
                        status: 'processing',
                        description: "ORDER PLACED SUCCESSFULLY"
                    }
                }
            }
        }
    };

    try {
        
        if(linkedUser?.sessionNumber == 5){
            const response = await axios.post(url, whatsappPayload, { headers });
            console.log("Payment status updated in WhatsApp:", response.data);
        }
        const updatedUser = await User.findOneAndUpdate({phone:`91${updatedOrder["customerDetails"]["phone"]}`},{$set:{sessionNumber:6}},{new:true})
        return true;
    } catch (error:any) {
        console.error("Error updating payment status in WhatsApp:", error);
        return false;
    }
    }else{
        return false
    }
    
}

// Function to format each timeline step
function formatTimelineStep(title: string, description: string): string {
    return `*${title}*\n_${description}_\n`;
}

async function createShiprocketOrder(order: any): Promise<any> {
  
  const order_items = []
  const shipment_dimensions = []
  const shipment_weights = []
  for(const item of order.items){
    const associated_product = await Catalogue.findOne({contentID : item.productID})
    const order_item = {
      "name": associated_product?.title,
      "sku": associated_product?._id,
      "units": item.qty,
      "selling_price": associated_product?.salePrice,
      "discount": "",
      "tax": "",
      "hsn": 9701
    }

    shipment_dimensions.push(associated_product?.dimensions)
    shipment_weights.push(associated_product?.weight)
    order_items.push(order_item)
  }

  console.log(shipment_dimensions)

  const shipment_weights_sum = shipment_weights.reduce((accumulator:any, currentValue:any) => accumulator + currentValue, 0);
  const maxDimensionElement = shipment_dimensions.reduce((max:any, current:any) => {
    return max.length > current.length ? max : current;
  }, shipment_dimensions[0]);

  const data = {
      "order_id": order._id, 
      "order_date": order.createdAt.toISOString(), 
      "pickup_location": "kraft_point", 
      "channel_id": "", 
      "comment": "", 
      "billing_customer_name": order.customerDetails.firstName, 
      "billing_last_name": order.customerDetails.lastName, 
      "billing_address": order.shippingAddress.street1, 
      "billing_address_2": order.shippingAddress.street2, 
      "billing_city": order.shippingAddress.city, 
      "billing_pincode": order.shippingAddress.pincode, 
      "billing_state": order.shippingAddress.state, 
      "billing_country": "India", 
      "billing_email": order.customerDetails.email, 
      "billing_phone": order.customerDetails.phone, 
      "shipping_is_billing": true, 
      "shipping_customer_name": "", 
      "shipping_last_name": "", 
      "shipping_address": "", 
      "shipping_address_2": "", 
      "shipping_city": "", 
      "shipping_pincode": "", 
      "shipping_state": "", 
      "shipping_country": "", 
      "shipping_email": "", 
      "shipping_phone": "", 
      "order_items": order_items,
      "payment_method": "Prepaid", 
      "sub_total": order.total, 
      "shipping_charges": 0, 
      "giftwrap_charges": 0, 
      "transaction_charges": 0, 
      "total_discount": 0, 
      "length": maxDimensionElement.length, 
      "breadth": maxDimensionElement.breadth, 
      "height": maxDimensionElement.height, 
      "weight": shipment_weights_sum
  };

  console.log("CREATABLE SHIPROCKET ORDER")
  console.log(JSON.stringify(data))

  const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: envConfig.shiprocket.create_uri,
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${shiprocketToken}`
      },
      data: JSON.stringify(data)
  };

  const response = await axios(config);
  return response.data;
}
