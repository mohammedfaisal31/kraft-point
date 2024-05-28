import asyncMiddleware from "../middlewares/async.middleware";
import paymentWBK from "../models/paymentWBK";
import { Req, Res, Next } from "../types/express";
import { handlePaymentCapturedEvent, rzpay } from "../utils/payment";

const receive = asyncMiddleware(async (_req: Req, res: Res): Promise<Res> => {
  console.log("--------Payment Webhook----------------");
  await handlePaymentCapturedEvent(_req.body)
  return res.status(200);
});

const rzpayRcv = asyncMiddleware(async (_req: Req, res: Res): Promise<Res> => {
  console.log("--------Razorpay Payment Webhook----------------");

  console.time("rzpayExecutionTime"); // Start the timer
  await rzpay(_req.body);
  console.timeEnd("rzpayExecutionTime"); // End the timer and log the elapsed time

  return res.status(200).json({ok:"ok"});
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

export default { receive ,rzpayRcv};
