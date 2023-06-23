require('dotenv').config()

const express = require('express');

const twilio_sms = require('../controller/twilio-sms');
const router = express.Router();

router.post('/send-otp', twilio_sms.sendOTP);
router.post('/verify-otp', twilio_sms.verifyOTP);

module.exports = router;
