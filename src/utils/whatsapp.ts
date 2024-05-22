import WhatsAppOrder from "../types/whatsappOrder"
import Catalogue from "../models/catalogue.model";
import Order from "../models/order.model";
import User from "../models/user.model";
import axios from 'axios';

import envConfig from "../config";


const accessToken = envConfig.whatsapp.access_token
const url = envConfig.whatsapp.graph_uri;
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
    
export async function sendFlow(flowId: string, toNumber: string):Promise<Boolean> {
    
    const data = {
        recipient_type: "individual",
        messaging_product: "whatsapp",
        to: toNumber,
        type: "interactive",
        interactive: {
            type: "flow",
            header: {
                "type": "text",
                "text": "Shipping Details"
              },
            body: {
                "text": "Hey there👋\n\nWe've received your request\n\nLet's add a touch of creativity to your surroundings!\n\nDrop your info and let's curate your home decor🌟"
              },
            footer: {
                "text": "Click the button below to enter the booking details"
            },
            action: {
                name: "flow",
                parameters: {
                    flow_message_version: "3",
                    flow_token: "AQAAAAACS5FpgQ_cAAAAAD0QI3s.",
                    flow_id: flowId,
                    flow_cta: "Enter booking details",
                    flow_action: "navigate",
                    flow_action_payload: {
                        screen: "SHIP", // Change this to the appropriate screen ID
                        data: {"firstName":"Mohammed"} // You can pass additional data here if needed
                    }
                }
            }
        }
    };

   
    try {
        const response = await axios.post(url, data, { headers });
        console.log("Flow sent successfully:", response.data);
        const updatedUser = await User.updateOne({phone:toNumber},{$set:{sessionNumber:3}})
        return true
    } catch (error:any) {
        console.error("Error sending flow:", error.response.data);
        return false;
    }
}

export async function processAndUpdateOrder(messageData: any):Promise<Object | null> {
    try {
        const phoneNumber = messageData["entry"][0]["changes"][0]["value"]["messages"][0]["from"];
        console.log(phoneNumber)
        const customer = await User.findOne({phone:phoneNumber})
        console.log(customer)
        // Find order with status 'active' for the matched phone number
        const order :any = await Order.findOne({ customer : customer?._id, status : "active" });
        if (!order) {
            console.error("No active order found for the phone number:", phoneNumber);
            return null;
        }

        // Process and parse the response_json into JSON
        const responseJson = messageData["entry"][0]["changes"][0]["value"]["messages"][0]["interactive"]["nfm_reply"]["response_json"];
        const parsedResponse = JSON.parse(responseJson);

        
        
        if (!order.customerDetails) {
            order.customerDetails = {};
        }
        if (!order.shippingAddress) {
            order.shippingAddress = {};
        }

        // Update relevant fields in the order schema
        order["customerDetails"]["firstName"] = parsedResponse.firstName;
        order["customerDetails"]["lastName"] = parsedResponse.lastName;
        order["customerDetails"]["email"] = parsedResponse.email;
        order["customerDetails"]["phone"] = parsedResponse.phone;
        order["shippingAddress"]["street1"] = parsedResponse.address_1;
        order["shippingAddress"]["street2"] = parsedResponse.address_2;
        order["shippingAddress"]["city"] = parsedResponse.city;
        order["shippingAddress"]["state"] = parsedResponse.state;
        order["shippingAddress"]["pincode"] = parsedResponse.pincode;
        
        // Save the updated order
        await order.save();
        console.log("Order updated successfully:", order);
        const updatedUser = await User.updateOne({phone:phoneNumber},{$set:{sessionNumber:4}})
        return order
    } catch (error) {
        console.error("Error processing and updating order:", error);
        return null;
    }
}
export async function sendPaymentIntent(order:any,link:String,toNumber:String):Promise<Boolean | null>{
  
  let order_items = []
  for(const item of order.items){
    const productDetails:any  = await Catalogue.findOne({contentID:item?.productID})
    if(productDetails){
      const object = {
        retailer_id: item?.productID,
        name: productDetails["title"], 
        amount: {
          value: productDetails["price"] * 100, 
          offset: 100
        },
        quantity: item.qty,
        sale_amount: {
          value: productDetails["salePrice"] * 100, 
          offset: 100
        }
      }

      order_items.push(object)
    }
    
  }
  
  const orderDetails = {
    interactive: {
      type: "order_details",
      header: {
        type: "image",
        image: {
          link: `${envConfig.server_url}/products/${order_items[0]["retailer_id"]}.jpeg`
          
        }
      },
      body: {
        text: "Order details for your purchase."
      },
      footer: {
        text: "Thank you for shopping with us!"
      },
      action: {
        name: "review_and_pay",
        parameters: {
          reference_id: order._id,
          type: "physical-goods",
          payment_type: "upi",
          payment_settings: [
            {
              type: "payment_link",
              payment_link: {
                uri: link
              }
            }
          ],
          currency: "INR",
          total_amount: {
            value: order.total * 100, 
            offset: 100
          },
          order: {
            status: "pending",
            catalog_id: "976461464076822",
            expiration: {
              timestamp: Math.floor((Date.now()+72 * 60 * 60 * 1000) / 1000), // 1 day expiration time
              description: "Order will be automatically cancelled after expiration."
            },
            items: order_items,
            subtotal: {
              value: order.total * 100, 
              offset: 100
            },
            tax: {
              value: 0, 
              offset: 100
            }
            
          }
        }
      }
    }
  };
  const data = {
    recipient_type: "individual",
    messaging_product: "whatsapp",
    to: toNumber,
    type: "interactive",
    interactive : orderDetails.interactive

  }
  try {
    const response = await axios.post(url, data, { headers });
    console.log("Payment Intent sent successfully:", response.data);
    const updatedUser = await User.updateOne({phone:toNumber},{$set:{sessionNumber:5}})
    return true;
} catch (error:any) {
    console.error("Error sending flow:", error.response.data);
    return false;
}

  
}

export async function sendContinueMessage(toNumber:string){
  const data = {
    recipient_type: "individual",
    messaging_product: "whatsapp",
    to: toNumber,
    type: "text",
    text: {
      body: "You have an active order which is not fulfilled yet! Please complete the order first"
    }
  }

  try {
    const response = await axios.post(url, data, { headers });
    console.log("Message sent successfully:", response.data);
    return true;
  } catch (error:any) {
    console.error("Error sending message:", error.response.data);
    return false;
}

}

export  function getRequestType(data:any):string{
    return data["entry"][0]["changes"][0]["value"]["messages"][0]["type"]
}



async function findUserByPhone(phone: string) {
    try {
      const user = await User.findOneAndUpdate({ phone : phone},{$set:{sessionNumber:2}},{new:true});
      return user;
    } catch (error) {
      console.error("Error finding user by phone:", error);
      throw error; // Re-throw for handling in processOrder
    }
  }
  
  async function createUserFromOrder(orderData: WhatsAppOrder,customerPhone:string) {
    try {
      const newUser = new User({ phone: customerPhone, whatsapp: true, sessionNumber : 2 });
      await newUser.save();
      console.log("New user created:", newUser._id);
      return newUser;
    } catch (error) {
      console.error("Error creating user from order:", error);
      throw error; // Re-throw for handling in processOrder
    }
  }
async function insertOrder(orderData: any) {
    try {
      const newOrder = new Order(orderData);
      await newOrder.save();
      console.log("Order created successfully:", newOrder._id);
      return newOrder;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error; 
    }
  }


export async function getOrderValue(order: WhatsAppOrder): Promise<number | null> {
  const { product_items } = order["entry"][0]["changes"][0]["value"]["messages"][0]["order"];
  console.log(product_items)
  let totalPrice = 0;
  let itemsFound = true;
  
  const customerPhone = order["entry"][0]["changes"][0]["value"]["messages"][0]["from"]; 

  // Check for existing user by phone number
  let customer;
  try {
    customer = await findUserByPhone(customerPhone);
  } catch (error) {
    console.error("Error finding user:", error);
  }

  // If user not found, create a new user
  if (!customer) {
    customer = await createUserFromOrder(order,customerPhone);
  }

  
  
 
  let items = []
  for (const item of product_items){
    const { product_retailer_id, quantity } = item;
    
    const product = await Catalogue.findOne({ contentID: parseInt(product_retailer_id) });
    console.log(product)

    if (product) {
      console.log("Product Found")
      console.log(product)

      const itemPrice : number | undefined = product.salePrice; 

      if(itemPrice){
        items.push({productID : parseInt(product_retailer_id),qty : quantity})
        totalPrice += itemPrice * quantity;
      }
      
    } else {
      console.warn(`Product with contentID: ${product_retailer_id} not found in catalogue`);
      itemsFound = false;
      break;
      
    }
  }

  if(itemsFound){
    // Call insertOrder with the customer ID
    const createdOrder = await insertOrder({
        customer: customer._id,
        total : totalPrice,
        items : items
    });
    if(createdOrder){
        return totalPrice
    }
    else{
        return null
    }
    
  }else{
    return null
  }
  
 

}


