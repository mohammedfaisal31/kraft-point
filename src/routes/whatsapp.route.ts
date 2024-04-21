import { Router } from 'express'
import controller from '../controllers/whatsapp.controller';

const router: Router = Router()

router.post('/webhook', controller.receive);
router.get('/webhook', controller.returnReq);


router.post('/flow',controller.acceptFlow)

export default router