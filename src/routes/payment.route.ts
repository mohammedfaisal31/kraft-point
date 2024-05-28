import { Router } from 'express'
import express from "express"
import controller from '../controllers/payment.controller';

const router: Router = Router()

router.use(express.urlencoded({ extended: true }));
//router.post('/webhook', controller.receive);

router.post('/rzpay', controller.rzpayRcv);




export default router