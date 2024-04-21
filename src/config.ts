import dotenv from 'dotenv'
dotenv.config()
console.log("env: ", process.env.NODE_ENV);

const envConfig: any = {
    port: process.env.PORT || 6006,
    environment: process.env.NODE_ENV,
    server_url: process.env.SERVER_URL,
    stripe: {
        secret: process.env.STRIPE_SECRET_KEY,
        webhook_secret: process.env.STRIPE_WEBHOOK_SECRET
    },
    cloudinary: {
        name: process.env.CLOUDINARY_CLOUD_NAME,
        key: process.env.CLOUDINARY_API_KEY,
        secret: process.env.CLOUDINARY_API_SECRET
    },
    db: {
        uri: process.env.DB_URI,
        pass: process.env.DB_PASS,
    },
    google:{
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_SECRET,
        redirect_url: process.env.GOOGLE_REDIRECT
    },
    mailer:{
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    },
    jwt: {
        sign: process.env.JWT_SIGN,
        expire: process.env.JWT_EXPIRE
    },
    whatsapp:{
        verify_token : process.env.VERIFY_TOKEN,
        access_token : process.env.WHATSAPP_ACCESS_TOKEN,
        graph_uri : process.env.WHATSAPP_GRAPH_URI
    },
    razorpay:{
        key_id : process.env.RAZORPAY_KEY_ID,
        secret_id: process.env.RAZORPAY_SECRET_ID
    },
    shiprocket:{
        token:process.env.SHIPROCKET_TOKEN,
        create_uri : process.env.SHIPROCKET_CREATE_URI
    }
}
export default envConfig