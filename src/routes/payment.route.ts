import { Router } from 'express'
import controller from '../controllers/payment.controller';

const router: Router = Router()

router.post('/webhook', controller.receive);




export default router