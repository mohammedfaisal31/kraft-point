import asyncMiddleware from '../middlewares/async.middleware'
import { Req, Res, Next } from '../types/express'
import { handlePaymentCapturedEvent } from '../utils/payment'

const receive = asyncMiddleware(async (_req: Req, res: Res): Promise<Res> => {
    
    if(_req.body.entity == "event" && _req.body.event == "payment.captured" ){
        const updatedWhatsAppStatus = await handlePaymentCapturedEvent(_req.body.payload)
        if(updatedWhatsAppStatus){
            return res.status(200)
        }else{
            return res.status(400)
        }
    }

    return res.status(200)
})

export default {receive}