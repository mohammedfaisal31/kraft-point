import asyncMiddleware from "../middlewares/async.middleware";
import paymentWBK from "../models/paymentWBK";
import { Req, Res, Next } from "../types/express";
import { handlePaymentCapturedEvent } from "../utils/payment";

const receive = asyncMiddleware(async (_req: Req, res: Res): Promise<Res> => {
  console.log("--------Payment Webhook----------------");
  console.log(_req.body);
  console.log(JSON.stringify(_req.body));

  if (_req.body.created_at !== null && _req.body.created_at !== undefined) {
    const validatedWebhook = await validateWebhook(
      parseInt(_req.body.created_at)
    );
    if (validatedWebhook) {
      if (
        _req.body.entity == "event" &&
        (_req.body.event == "payment_link.paid" ||
          _req.body.event == "payment.captured")
      ) {
        const updatedWhatsAppStatus = await handlePaymentCapturedEvent(
          _req.body.payload
        );
        if (updatedWhatsAppStatus) {
          return res.status(200);
        } else {
          return res.status(400);
        }
      }
    }
  }

  return res.status(200);
});

const validateWebhook = async (created_at: Number) => {
  const result = await paymentWBK.findOne({ created_at: created_at });
  if (result == null) {
    await paymentWBK.create({ created_at: created_at });
    return true;
  } else {
    return false;
  }
};

export default { receive };
