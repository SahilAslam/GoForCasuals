const express = require('express')
const route = express.Router()
const admin_controller = require('../controller/admin_controller')
const fs = require('fs')
const multer = require('multer')
const categorySchema=require('../model/add_category')
const sharp = require('sharp');
const path = require('path')

// import swal from 'sweetalert';

// // setting multer to add multiple images
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // make sure directory exists
//     const uploadDir = './uploads';
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir);
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     // remove spaces and special characters from original filename
//     const originalname = file.originalname.replace(/[^a-zA-Z0-9]/g, "");
//     // set filename to fieldname + current date + original filename
//     cb(null, `${file.fieldname}_${Date.now()}_${originalname}`);
//   },
// });
  
// var upload = multer({
//   storage: storage,
// })
// // .single("photo");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); // Specify the destination folder for uploaded files
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + ext); // Set a unique filename for each uploaded file
  }
});

const upload = multer({ storage: storage });

route.get('/admin', (req, res)=>{
    res.render('admin/admin_login')
})

route.get('/admin_index', (req, res)=>{
    res.render('admin/admin_index')
})

route.post('/admin',admin_controller.adminLogin);
route.get('/adminLogout',admin_controller.admin_logout)
route.get('/product', admin_controller.checkLoggedIn, admin_controller.find_product)
route.get('/addProduct', admin_controller.checkLoggedIn, admin_controller.add_product )
route.post('/addProduct',upload.array('photo', 5), admin_controller.addProduct)
route.get('/delete_product/:id', admin_controller.delete_product)
route.get('/block_product/:id', admin_controller.block_product)
route.get('/unblock_product/:id', admin_controller.unblock_product)
route.get('/category', admin_controller.checkLoggedIn, admin_controller.find_category)
route.get('/add_category', admin_controller.checkLoggedIn, admin_controller.addCategory)
route.post('/add_category', admin_controller.add_category)
route.get('/delete_category/:id', admin_controller.delete_category)
route.get('/update_product/:id', admin_controller.checkLoggedIn, admin_controller.update_product)
route.post('/update_product/:id', upload.array('photo', 5), admin_controller.updateProduct)
route.get('/user', admin_controller.checkLoggedIn, admin_controller.find_user)
route.get('/block_user/:id', admin_controller.block_user)
route.get('/unblock_user/:id', admin_controller.unblock_user)
route.get('/orders', admin_controller.checkLoggedIn, admin_controller.order_page)
route.post('/update_order/:id', admin_controller.updateOrder)
route.get('/admin-orderDetails/:id', admin_controller.checkLoggedIn, admin_controller.order_details)
route.get('/admin_dashboard', admin_controller.checkLoggedIn, admin_controller.admin_dashboard)
route.get('/addCoupon', admin_controller.checkLoggedIn, admin_controller.add_coupon)
route.post('/addCoupon', admin_controller.checkLoggedIn, admin_controller.addCoupon)
route.get('/coupon', admin_controller.checkLoggedIn, admin_controller.coupon_page)
route.get('/delete-coupon/:id', admin_controller.checkLoggedIn, admin_controller.delete_coupon)
route.get('/refund/:id', admin_controller.checkLoggedIn, admin_controller.refund)
route.get('/sales-report', admin_controller.checkLoggedIn, admin_controller.sales_report)
route.post('/adminSalesFilter', admin_controller.checkLoggedIn, admin_controller.salesReportFilter)
route.get('/banner', admin_controller.checkLoggedIn, admin_controller.Banner)
route.get('/addBanner', admin_controller.checkLoggedIn, admin_controller.addBanner)
route.post('/addBanner', upload.array('photo',5), admin_controller.add_banner)
route.get('/activateBanner/:id', admin_controller.activateBanner)
route.get('/deactivateBanner/:id', admin_controller.deactivateBanner)


module.exports = route

