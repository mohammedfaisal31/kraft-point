import { Router } from 'express';
import category from './category.route'
import product from './product.route'
import auth from './auth.route'
import user from './user.route'
import cart from './cart.route'
import checkout from './checkout.route'
import order from './order.route'
import asset from './asset.route'
import whatsapp from "./whatsapp.route"
import payment from './payment.route'
import productsImages from './products.route'

const router: Router = Router()

router.use('/v1/categories', category);
router.use('/v1/products', product);
router.use('/v1/auth', auth)
router.use('/v1/users', user)
router.use('/v1/carts', cart)
router.use('/v1/checkout', checkout)
router.use('/v1/orders', order)
router.use('/v1/assets', asset)

//Whatapp Webhook
router.use('/v1/whatsapp', whatsapp)

//Payment Webhook
router.use('/v1/payment', payment)

//Products 
router.use('/v1/productsimages', productsImages)



export default router