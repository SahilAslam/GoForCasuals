require('dotenv').config();
const userSchema = require("../model/user_model");
const productSchema = require("../model/product_model")
const bcrypt = require("bcrypt");
const accountSid = process.env.TWILIO_ACCOUNT_SID ;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken)
const serviceSid = process.env.TWILIO_SERVICE_SID;

// send otp
exports.sendOTP = async (req, res, next) => {
    console.log("sms");
    const { phone } = req.body;
    req.session.phone = phone
    try {
        const user = await userSchema.findOne({ phone: phone});
        if(!user) {
            res.render('user/otp_login', { message: "Phone number is not registered" })
        } else {
            const otpResponse = await client.verify.v2
          .services(serviceSid)
          
          .verifications.create({
              to:"+91"+phone,
              channel: "sms",
          });
        }
        
        res.render('user/otp_login', { message: "OTP sent successfully" })
    } catch(error) {
        res.status(error?.status || 400).send(error?.message || 'Something went wrong!');
    }
};

// verify otp
exports.verifyOTP = async (req, res, next) => {
    const verificationCode = req.body.otp;
    const phoneNumber = req.session.phone;
    
    if(!phoneNumber) {
        res.status(400).send({ message: 'Phone number is required' });
        return;
    }
    try {
        const verification_check = await client.verify.v2
          .services(serviceSid)
          .verificationChecks.create({
              to:"+91"+phoneNumber,
              code: verificationCode,
          });
          console.log(verification_check.status,'aaaaaaaaaaaaaaaaaaaaaaaa');
          if (verification_check.status === 'approved') {
            // If the verification is successful, do something
            const user = await userSchema.findOne({ phone: phoneNumber });
            console.log(user,"asdfghjk ");
            const product = await  productSchema.find()
            req.session.user = user;
            res.redirect('/')
          } else {
            // If the verification fails, return an error message
            res.render('user/login', { message: "Invalid verification code" });
          }
    } catch(error) {
        res.status(500).send({ message: error.message || 'Some error occurred while verifying the code' });
    }
};   

