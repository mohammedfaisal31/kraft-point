import asyncMiddleware from '../middlewares/async.middleware'
import { Req, Res, Next } from '../types/express'
import config from '../config'
import {getRequestType,getOrderValue,sendFlow, processAndUpdateOrder, sendPaymentIntent, sendContinueMessage} from '../utils/whatsapp'
import User from '../models/user.model'
import { createPaymentOrder } from '../utils/payment'
import orderController from './order.controller'
import e from 'express'

const receive = asyncMiddleware(async (_req: Req, res: Res): Promise<Res> => {
    const data = _req.body
    const reqType = getRequestType(data)
    const customerPhone = data["entry"][0]["changes"][0]["value"]["messages"][0]["from"];
    const user  = await User.findOne({phone:customerPhone})
    
    if ( reqType === "order"){
        if(user !== null){
            if (user["sessionNumber"] >= 2 ){
                const messageSent = await sendContinueMessage(customerPhone)
                if(messageSent){
                    return res.status(200).json({ok:"ok"})
                }
                else{
                    return res.status(400).json({err:"error"})
                }
            }
            else{
                const orderValue = await getOrderValue(data)
                if(orderValue){
                    if(await sendFlow("1596386641159809",customerPhone)){
                        return res.status(200).json({ok:"ok"})
                    }else{
                        return res.status(400).json({err:"error"})
                    }
                }else{
                    return res.status(400).json({err:"error"})
                }
                
            }
        }
        else{
            const orderValue = await getOrderValue(data)
            if(orderValue && await sendFlow("1596386641159809",customerPhone)){
                return res.status(200).json({ok:"ok"})
            }else{
                return res.status(400).json({err:"error"})
            }
                
        }
        
    }
    else if( reqType === "interactive"){
        const created_order :any = await processAndUpdateOrder(data);
       if(created_order !== null){
            const created_payment_link : any  = await createPaymentOrder(created_order)
            const created_payment_intent : any = await sendPaymentIntent(created_order,created_payment_link["short_url"],customerPhone)
            if(created_payment_intent){
                return res.status(200).json({ok:"ok"})
            }else{
                return res.status(400).json({err:"error"})
            }
            
        }  
    }

    return res.status(200).json({ok:"ok"})
    
})

const acceptFlow = asyncMiddleware(async (_req: Req, res: Res): Promise<Res> => {
    console.log(_req.body)
    return res.status(200)
})

const returnReq = asyncMiddleware(async (_req: Req, res: Res): Promise<Res> => {
    console.log(_req.query)
    const hub = _req.query
    const challenge = hub["hub.challenge"] as string
    if (hub["hub.mode"] == "subscribe" && hub["hub.verify_token"] == config.whatsapp.verify_token){
        return res.status(200).send(challenge);
    }
    else{
        return res.status(403).send("Invalid Token")
    }   
    
    
})



export default {
    receive,
    returnReq,
    acceptFlow
}