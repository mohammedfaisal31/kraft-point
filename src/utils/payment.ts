import envConfig from "../config";
import Razorpay from "razorpay";
import Order from "../models/order.model";
import axios from "axios";
import Catalogue from "../models/catalogue.model";
import User from "../models/user.model";
import Request from "request";
import instamojo from "instamojo-nodejs";

const whatsappAcessToken = envConfig.whatsapp.access_token;
const url = envConfig.whatsapp.graph_uri;
const headers = {
  Authorization: `Bearer ${whatsappAcessToken}`,
  "Content-Type": "application/json",
};

const shiprocketToken = envConfig.shiprocket.token;

export async function createPaymentOrder(order: any): Promise<Object | null> {
  instamojo.setKeys(envConfig.instamojo.key_id, envConfig.instamojo.auth_token);
  if(envConfig.environment == "dev"){
    instamojo.isSandboxMode(true);
  }
  let data = new instamojo.PaymentData();

  (data.purpose = "Kraft Point Products"),
    (data.amount = order["total"]),
    (data.currency = "INR"),
    (data.buyer_name = `${order["customerDetails"]["firstName"]} ${order["customerDetails"]["lastName"]}`),
    (data.phone = order["customerDetails"]["phone"]),
    (data.email = order["customerDetails"]["email"]),
    (data.send_email = true),
    (data.send_sms = true),
    (data.webhook = `${envConfig.server_url}/kraft/api/v1/payment/webhook`), // Replace with your webhook URL
    (data.redirect_url = "https://wa.me/919739469147"), // Update with your desired redirect URL
    data.setWebhook(`${envConfig.server_url}/kraft/api/v1/payment/webhook`);
    data.setRedirectUrl("https://wa.me/919739469147");

  return new Promise((resolve, reject) => {
    instamojo.createPayment(data, async function (error, response) {
      if (error) {
        reject(null);
      } else {
        const updatedOrder = await Order.findByIdAndUpdate(order._id,{$set:{paymentRequestID:JSON.parse(response)["payment_request"]["id"],paymentLink:JSON.parse(response)["payment_request"]["longurl"]}})
        
        if(updatedOrder){
          console.log("PAYMENT ID updated in order",updatedOrder)
          resolve(JSON.parse(response)["payment_request"]);
        } else {
          reject(null)
        }
        
      }
    });
  });
}

// Assuming you have the Shiprocket token

export async function handlePaymentCapturedEvent(
  payload: any
): Promise<boolean> {
  console.log("PAYLOAD",payload);
  const {status,payment_request_id,payment_id} = payload
  console.log(status)
  console.log(payment_request_id)
  console.log(payment_id)
  
  // if(status !== "Credit"){
  //   return false
  // }

  const updatedOrder: any = await Order.findOneAndUpdate(
    { paymentRequestID: payment_request_id },
    { $set: { paymentStatus: "completed", status: "processing" ,paymentID:payment_id} },
    { new: true }
  );
  console.log(updatedOrder);

  const user: any = await User.findOne({
    phone: `91${updatedOrder["customerDetails"]["phone"]}`,
  });

  if (user["sessionNumber"] == 5) {
    // Create Shiprocket order
    try {
      const shiprocketOrder = await createShiprocketOrder(updatedOrder);
      console.log("Shiprocket order created:", shiprocketOrder);
    } catch (error) {
      console.error("Error creating Shiprocket order:", error);
      return false;
    }

    const linkedUser = await User.findOne({
      phone: `91${updatedOrder["customerDetails"]["phone"]}`,
    });
    console.log(linkedUser);

    // Prepare WhatsApp message payload with a stylish timeline
    const whatsappMessage = `\nThank you for placing the order🙏\n\nYour Order ID is *${updatedOrder._id}*\n\nYour payment has been successfully captured✅\n------------------------------------\n*ORDER:PROCESSING🕒*\n------------------------------------\n\nWe will notify you once the order is dispatched and shipped😊`;

    const whatsappPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: `91${updatedOrder["customerDetails"]["phone"]}`,
      type: "interactive",
      interactive: {
        type: "order_status",
        body: {
          text: whatsappMessage,
        },
        action: {
          name: "review_order",
          parameters: {
            reference_id: updatedOrder._id,
            order: {
              status: "processing",
              description: "ORDER PLACED SUCCESSFULLY",
            },
          },
        },
      },
    };

    try {
      if (linkedUser?.sessionNumber == 5) {
        const response = await axios.post(url, whatsappPayload, { headers });
        console.log("Payment status updated in WhatsApp:", response.data);
      }
      const updatedUser = await User.findOneAndUpdate(
        { phone: `91${updatedOrder["customerDetails"]["phone"]}` },
        { $set: { sessionNumber: 6 } },
        { new: true }
      );
      return true;
    } catch (error: any) {
      console.error("Error updating payment status in WhatsApp:", error);
      return false;
    }
  } else {
    return false;
  }
}

async function createShiprocketOrder(order: any): Promise<any> {
  const order_items = [];
  const shipment_dimensions = [];
  const shipment_weights = [];
  for (const item of order.items) {
    const associated_product: any = await Catalogue.findOne({
      contentID: item.productID,
    });
    const order_item = {
      name: associated_product?.title,
      sku: associated_product?._id,
      units: item.qty,
      selling_price: associated_product?.salePrice,
      discount: "",
      tax: "",
      hsn: 9701,
    };

    shipment_dimensions.push(associated_product?.dimensions);
    shipment_weights.push(associated_product?.weight * item.qty);
    order_items.push(order_item);
  }

  console.log(shipment_dimensions);

  const shipment_weights_sum = shipment_weights.reduce(
    (accumulator: any, currentValue: any) => accumulator + currentValue,
    0
  );
  const maxDimensionElement = shipment_dimensions.reduce(
    (max: any, current: any) => {
      return max.length > current.length ? max : current;
    },
    shipment_dimensions[0]
  );

  const data = {
    order_id: order._id,
    order_date: order.createdAt.toISOString(),
    pickup_location: "kraft_point",
    channel_id: "",
    comment: "",
    billing_customer_name: order.customerDetails.firstName,
    billing_last_name: order.customerDetails.lastName,
    billing_address: order.shippingAddress.street1,
    billing_address_2: order.shippingAddress.street2,
    billing_city: order.shippingAddress.city,
    billing_pincode: order.shippingAddress.pincode,
    billing_state: order.shippingAddress.state,
    billing_country: "India",
    billing_email: order.customerDetails.email,
    billing_phone: order.customerDetails.phone,
    shipping_is_billing: true,
    shipping_customer_name: "",
    shipping_last_name: "",
    shipping_address: "",
    shipping_address_2: "",
    shipping_city: "",
    shipping_pincode: "",
    shipping_state: "",
    shipping_country: "",
    shipping_email: "",
    shipping_phone: "",
    order_items: order_items,
    payment_method: "Prepaid",
    sub_total: order.total,
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    length: maxDimensionElement.length,
    breadth: maxDimensionElement.breadth,
    height: maxDimensionElement.height,
    weight: shipment_weights_sum,
  };

  console.log("CREATABLE SHIPROCKET ORDER");
  console.log(JSON.stringify(data));

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: envConfig.shiprocket.create_uri,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${shiprocketToken}`,
    },
    data: JSON.stringify(data),
  };

  const response = await axios(config);
  return response.data;
}
