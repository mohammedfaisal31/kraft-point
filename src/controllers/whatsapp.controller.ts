import asyncMiddleware from "../middlewares/async.middleware";
import { Req, Res, Next } from "../types/express";
import config from "../config";
import {
  getRequestType,
  getOrderValue,
  sendFlow,
  processAndUpdateOrder,
  sendPaymentIntent,
  sendOrderContinuationPrompt,
  handleContinuePrompt
} from "../utils/whatsapp";
import User from "../models/user.model";
import { createPaymentOrder } from "../utils/payment";
import orderController from "./order.controller";
import e from "express";
import orderModel from "../models/order.model";
import userModel from "../models/user.model";
import continueWBK from "../models/continueWBK";

const receive = asyncMiddleware(async (_req: Req, res: Res): Promise<Res> => {
  const data = _req.body;
  const reqType = getRequestType(data);
  const customerPhone =
  data["entry"][0]["changes"][0]["value"]["messages"][0]["from"];
  const user = await User.findOne({ phone: customerPhone });
  console.log(JSON.stringify(data));

  if (reqType === "order") {
    if (user !== null) {
      console.log("User found");

      const existingOrder = await orderModel.findOne({
        customer: user._id,
        status: { $in: ["active", "processing"] },
      });

      if (existingOrder) {
        console.log("Existing order found");
        if (await sendOrderContinuationPrompt(customerPhone,existingOrder,data)) {
          return res.status(200).json({ ok: "ok" });
        } else {
          return res.status(400).json({ err: "error" })
        }
      } else {
        if (user["sessionNumber"] <= 3) {
          const orderValue = await getOrderValue(data,false);
          console.log(orderValue);
          if (orderValue) {
            if (await sendFlow("1596386641159809", customerPhone)) {
              console.log(
                "--------------------------------- SENDING RESPONSE 200 ---------------------------------"
              );
              return res.status(200).json({ ok: "ok" });
            } else {
              return res.status(400).json({ err: "error" });
            }
          } else {
            return res.status(400).json({ err: "error" });
          }
        }
      }
    } else {
      const orderValue = await getOrderValue(data,false);
      if (orderValue && (await sendFlow("1596386641159809", customerPhone))) {
        return res.status(200).json({ ok: "ok" });
      } else {
        return res.status(400).json({ err: "error" });
      }
    }
  } else if (reqType === "interactive") {
    if (user !== null && user["sessionNumber"] == 3) {
      const created_order: any = await processAndUpdateOrder(data);
      console.log("ORDER", created_order);
      if (created_order !== null) {
        await sendPaymentIntent(created_order, customerPhone);
        return res.status(200).json({ ok: "ok" });
      }
    }
  } else if (reqType === "button"){
    const timestamp = data["entry"][0]["changes"][0]["value"]["messages"][0]["timestamp"];
    if(user){
      await handleContinuePrompt(customerPhone,data)
    }
    return res.status(200);
  }

  return res.status(200).json({ ok: "ok" });
});

const acceptFlow = asyncMiddleware(
  async (_req: Req, res: Res): Promise<Res> => {
    console.log(_req.body);
    return res.status(200);
  }
);

const returnReq = asyncMiddleware(async (_req: Req, res: Res): Promise<Res> => {
  console.log(_req.query);
  const hub = _req.query;
  const challenge = hub["hub.challenge"] as string;
  if (
    hub["hub.mode"] == "subscribe" &&
    hub["hub.verify_token"] == config.whatsapp.verify_token
  ) {
    return res.status(200).send(challenge);
  } else {
    return res.status(403).send("Invalid Token");
  }
});

export default {
  receive,
  returnReq,
  acceptFlow,
};
