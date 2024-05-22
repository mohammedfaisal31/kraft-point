import { Router }  from 'express'
import controller  from '../controllers/productsImages.controller'
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { RequestHandler } from 'express';
import access from '../middlewares/access.middleware'

const router: Router = Router()


router.get('/:id', controller.getProductImage)

router.get('/', ()=>console.log("list"))
router.use((access as unknown) as RequestHandler<ParamsDictionary, any, any, Query>)



export default router