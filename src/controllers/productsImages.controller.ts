import asyncMiddleware from '../middlewares/async.middleware';
import { Req, Res, Next } from '../types/express'
import path from 'path';

const getProductImage = asyncMiddleware(async (req: Req, res: Res): Promise<Res> => {
    const filePath = req.params.id;
    console.log(__dirname, 'products', filePath)
    const resolvedPath = path.resolve(__dirname, 'products', filePath);
    res.status(200).sendFile(resolvedPath)
    return res
});

export default {getProductImage}