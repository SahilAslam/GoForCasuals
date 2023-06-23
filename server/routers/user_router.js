const express = require('express')
const route = express.Router()
const userSchema = require('../model/user_model')
const user_controller = require('../controller/user_controller')
const paypal=require('paypal-rest-sdk')


const isAuth = (req, res, next) => {
    if(req.session.isAuth) {
        next()
    } else {
        res.redirect('/login')
    }
}

const exUser = (req, res, next) => {
    if(req.session.exUser) {
        console.log('allready loginned');
        res.redirect('/', { message: 'allready loginned'})
    } else {
        next()
    }
}

const checkBlocked = async (req, res, next) => {
    try {
        if (req.session.user) {
            const userId = req.session.user;
            const user = await userSchema.findOne({ _id: userId }); // Assuming you're querying by '_id'
            
            if (user && user.isBlocked) { // Added null check for 'user' object
                req.session.save(() => {
                    res.redirect('/login');
                });
                return;
            }
        }
        next();
    } catch (error) {
        console.error('Error in isBlocked middleware', error);
        next(error);
    }
       
}


route.get('/otp_login', (req, res) => {
    res.render('user/otp_login')
})

route.get('/404', (req, res) => {
    res.render('user/404')
})

route.get('/',checkBlocked, user_controller.homeRoutes)
route.get('/signup', user_controller.userSignup)
route.post('/signup', user_controller.createUser)
route.get('/login',exUser, user_controller.userLogin)
route.post('/login',checkBlocked, user_controller.user_login)
route.get('/shop', user_controller.shop_page)
route.get('/logout',checkBlocked, user_controller.logout)
route.get('/product_view/:id',checkBlocked, user_controller.product_view)
route.get('/cart',checkBlocked, user_controller.userCart)
route.post('/add_to_cart/:id', user_controller.add_to_cart)
route.get('/deleteCartItem/:id', user_controller.deleteCartItem)
route.post('/incrementQuantity', user_controller.incrementQuantity)
route.post('/decrementQuantity', user_controller.decrementQuantity)
route.get('/userAddress',checkBlocked, user_controller.userAddress)
route.post('/userAddress', user_controller.addAddress)
route.get('/checkout/:id',checkBlocked, user_controller.checkout_page)
route.post('/checkout/:id', user_controller.checkout)
route.get('/order_confirm',checkBlocked, user_controller.orderConfirm)
route.get('/orderDetails',checkBlocked, user_controller.orderDetails)
route.get('/orderCancelled/:id', user_controller.cancelOrder)
route.get('/orderReturned/:id', user_controller.returnOrder)
route.get('/orderView/:id', user_controller.order_view)
route.get('/orderInvoice/:id', user_controller.order_invoice)
route.post('/update_address/:id', user_controller.update_address)
route.get('/paypal-success', user_controller.paypal_success)
route.get('/paypal-success', user_controller.paypal_err)
route.get('/user_profile',checkBlocked, user_controller.user_profile)
route.post('/redeemCoupon', user_controller.redeem_coupon)
route.get('/wallet', user_controller.user_wallet)
route.post('/wallet_buy', user_controller.wallet_pay)
route.get('/lowToHigh', user_controller.lowToHigh)
route.get('/highToLow', user_controller.highToLow)
route.post('/userDetailsEdit/:id', user_controller.userDetailsEdit)
route.post('/user-profile-address', user_controller.user_profile_address)
route.post('/user-profile-address-edit/:id', user_controller.user_profile_address_edit)
route.get('/delete-address/:id', user_controller.deleteAddress)
route.get('/wishlist', user_controller.wishlist)
route.post('/add-to-wishlist/:id', user_controller.addToWishlist)
route.delete("/deleteItem-Wishlist/:id",user_controller.removeItemWishlist)

module.exports = route