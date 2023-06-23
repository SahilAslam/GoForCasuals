const express = require('express')
const dotenv = require('dotenv')
const bodyparser = require('body-parser')
const path = require('path')
const session = require('express-session')
const nocache = require('nocache')
const connection = require('./server/connection/connection')
const twilio = require('./server/routers/twilio-sms')
const multer = require('multer')
const paypal=require('paypal-rest-sdk')

const app = express()

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

dotenv.config({path: 'config.env'})
const PORT = process.env.PORT||8080
const jsonParser = bodyparser.json()

app.use(nocache())

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { sameSite: "strict" }
}));

paypal.configure({
    'mode':'sandbox',
    'client_id':PAYPAL_CLIENT_ID,
    'client_secret':PAYPAL_CLIENT_SECRET
})

app.use(bodyparser.urlencoded({extended: true}));
app.use(jsonParser);

app.use('/twilio-sms',twilio)
app.set("view engine", "ejs");

app.use(express.static("uploads"));


// app.use('/css',express.static(path.resolve(__dirname, "public/assets/css")))
// app.use('/images',express.static(path.resolve(__dirname, "public/assets/images")))
// app.use('/js',express.static(path.resolve(__dirname, "public/assets/js")))
// app.use('/fonts',express.static(path.resolve(__dirname, "public/assets/fonts")))
// app.use('/vendor',express.static(path.resolve(__dirname, "public/assets/vendor")))



app.use(express.static(path.resolve(__dirname, "public")))


app.use('/', require('./server/routers/user_router'))
app.use('/', require('./server/routers/admin_router'))
app.use('/', require('./server/routers/twilio-sms'))


app.listen(PORT,()=>{console.log(`Server is running on http://localhost:${PORT}`)})
