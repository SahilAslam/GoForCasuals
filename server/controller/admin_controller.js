const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const categorySchema = require("../model/add_category");
const userSchema = require("../model/user_model");
const productSchema = require("../model/product_model");
const orderSchema = require("../model/order_model");
const couponSchema = require("../model/coupon_model")
const walletSchema = require("../model/wallet_model")
const bannerSchema = require("../model/banner_model")
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// import swal from 'sweetalert';

// checking whether admin is logged in or not
exports.checkLoggedIn = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.render("admin/admin_login");
  }
};

exports.adminLogin = (req, res) => {
  console.log(req.body);
  const email = req.body.email;
  const password = req.body.password;

  try {
    if (email == "admin@gmail.com") {
      console.log(email, password);
      if (password == 12345) {
        req.session.admin = true;
        res.redirect("/admin_dashboard");
      } else {
        res.render("admin/admin_login", { alert: "Invalid Password" });
      }
    } else {
      res.render("admin/admin_login", { message: "Inavlid Email" });
    }
  } catch (error) {
    console.log(error);
    res.send("An error ocuured while logging in");
  }
};

exports.admin_logout = (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
      res.send("error");
    } else {
      res.render("admin/admin_login");
    }
  });
};

exports.find_product = async (req, res) => {
  try {
    const product_data = await productSchema.find().exec();
    res.render("admin/product_details", { product_data });
  } catch (error) {
    console.log(error);
    res.send({ message: error.message });
  }
};

exports.find_user = async (req, res) => {
  try {
    const user_data = await userSchema.find().exec();
    res.render("admin/users", { user_data: user_data });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

exports.add_product = async (req, res) => {
  try {
    const data = await categorySchema.find();
    res.render("admin/add_product", { data });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

exports.addProduct = async (req, res) => {
  try {
    const product = new productSchema({
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
      description: req.body.description,
      stock: req.body.stock
    });

    // Crop and save each uploaded image
    const croppedImages = [];

    for (const file of req.files) {
      const croppedImage = `cropped_${file.filename}`;

      await sharp(file.path)
        .resize(500, 600, { fit: "cover" })
        .toFile(`uploads/${croppedImage}`);

      croppedImages.push(croppedImage);
    }

    product.photo = croppedImages;

    await product.save();

    const product_data = await productSchema.find().exec();

    res.render("admin/product_details", { product_data });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message || "Some error occurred" });
  }
};

exports.find_category = async (req, res) => {
  categorySchema
    .find()
    .then((find_category) => {
      res.render("admin/category", { find_category });
    })
    .catch((error) => {
      res.status(500).send("Server Error");
    });
};

exports.addCategory = (req, res) => {
  res.render("admin/add_category");
};

exports.add_category = async (req, res) => {
  try {
    const existingCategory = await categorySchema.findOne({
      category: req.body.category,
    });
    if (existingCategory) {
      return res.render("admin/add_category", {
        message: "Category already exists.",
      });
      // res.send(`<script>alert('${err}'); window.location='admin/add_Category';</script>`);
      // return res.status(400).send({ message: "Category already exists." });
    }

    const user = new categorySchema({
      category: req.body.category,
      description: req.body.description,
    });

    console.log(user);
    const data = await user.save();
    res.redirect("/category");
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message:
        error.message ||
        "Some error occurred while creating a create operation.",
    });
  }
};

exports.delete_product = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await productSchema.findByIdAndRemove(id)
    if (result) {
      res.redirect("/product");
    } else {
      res.redirect("/product");
    }
  }catch (error) {
    res.status(500).send(error.message);
  }
}

exports.block_product = async (req, res) => {
  console.log("delete");
  try {
    const id = req.params.id;
    const result = await productSchema
    .findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      { new: true }
    )
    console.log(result,"909");
    if (result) {
      res.redirect("/product");
    } else {
      res.redirect("/product");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.unblock_product = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await productSchema
    .findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      { new: true }
    )
    console.log(result,"909");
    if (result) {
      res.redirect("/product");
    } else {
      res.redirect("/product");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
}

exports.delete_category = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await categorySchema.findByIdAndRemove(id);
    if (result) {
      res.redirect("/category");
    } else {
      res.redirect("/category");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.update_product = async (req, res) => {
  try {
    const { id } = req.params;
    const prod = await productSchema.findById(id);
    const category = await categorySchema.find();

    if (!prod) {
      return res.redirect("/product");
    } else {
      return res.render("admin/update_product", { prod, category });
    }
  } catch (error) {
    console.log(error);
    return res.redirect("/product");
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const id = req.params.id;

    const files = req.files; // Assuming req.files contains the uploaded file(s)

    // Check if files were uploaded
    if (files && files.length > 0) {
      const newImages = files.map((file) => file.filename);

      // Delete the previous images
      if (req.body.photos && req.body.photos.length > 0) {
        req.body.photos.forEach((photo) => {
          try {
            fs.unlinkSync("./uploads/" + photo);
          } catch (error) {
            console.log(error);
          }
        });
      }

      // Crop and save the new images
      for (const file of files) {
        const newImage = file.filename;

        // Perform image cropping
        const croppedImageBuffer = await sharp(file.path)
          .resize({ width: 500, height: 600 })
          .toBuffer();

        // Save the cropped image to disk
        fs.writeFileSync("./uploads/" + newImage, croppedImageBuffer);

        newImages.push(newImage);
      }

      // Update the product's photo using findByIdAndUpdate
      const updatedProduct = await productSchema.findByIdAndUpdate(
        id,
        {
          name: req.body.name,
          category: req.body.category,
          description: req.body.description,
          price: req.body.price,
          photo: newImages,
        },
        { new: true }
      );

      if (updatedProduct) {
        console.log("Product photo updated");
        res.redirect("/product");
      } else {
        // If product not found
        console.log("Product not found");
        res.redirect("/product");
      }
    } else {
      console.log("No file uploaded");
      res.redirect("/product");
    }
  } catch (error) {
    console.error(error);
    res.send(error);
  }
};

exports.block_user = (req, res) => {
  const id = req.params.id;
  userSchema
    .findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      { new: true }
    )
    .then((updatedUser) => {
      res.redirect("/user");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Failed to update user");
    });
};

exports.unblock_user = (req, res) => {
  const id = req.params.id;
  userSchema
    .findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      { new: true }
    )
    .then((updatedUser) => {
      res.redirect("/user");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Failed to update user");
    });
};

exports.order_page = async (req, res) => {
  const orders = await orderSchema
    .find()
    .populate("user")
    .populate("items.product");
  res.render("admin/orders", { orders });
};

exports.updateOrder = async (req, res) => {
  try {
    const id = req.params.id;
    const orderStatus = req.body.status;
    const order = await orderSchema.findByIdAndUpdate(
      id,
      {
        status: orderStatus,
      },
      { new: true }
    );
    console.log(order);
    res.redirect("/orders");
  } catch (error) {
    console.log(error);
    res.status(501).send("Server Error");
  }
};

exports.order_details = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const orders = await orderSchema
      .findOne({ _id: id })
      .populate("user")
      .populate("items.product");
    console.log(orders);
    res.render("admin/order_details", { orders });
  } catch (error) {
    console.log(error);
    res.status(501).send("Server Error");
  }
};

exports.admin_dashboard = async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const startOfDay = new Date(today);
  const endOfDay = new Date(today);
  endOfDay.setDate(endOfDay.getDate() + 1);
  endOfDay.setMilliseconds(endOfDay.getMilliseconds() - 1);

  const todaySales = await orderSchema.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
    status: "Delivered",
  }).exec()

  const totalsales = await orderSchema.countDocuments({ status: "Delivered"});

  const todayRevenue = await orderSchema.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        status: "Delivered",
      },
    },
    { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
  ]);

  const revenue = todayRevenue.length > 0 ? todayRevenue[0].totalRevenue : 0;

  const TotalRevenue = await orderSchema.aggregate([
    {
      $match: { status: "Delivered" },
    },
    { $group: { _id: null, Revenue: { $sum: "$total" } } },
  ]);
  const Revenue = TotalRevenue.length > 0 ? TotalRevenue[0].Revenue : 0;
  console.log(TotalRevenue);

  const Orderpending = await orderSchema.countDocuments({ status: "Pending" });
  // const Orderprocessing = await orderSchema.countDocuments({
  //   status: "Processing"
  // });

  const Ordershipped = await orderSchema.countDocuments({ status: "Shipped" });

  const Ordercancelled = await orderSchema.countDocuments({
    status: "Cancelled",
  });

  const salesCountByMonth = await orderSchema.aggregate([
    {
      $match: {
        status: "Delivered",
      },
    },
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id.month",
        year: "$_id.year",
        count: 1,
      },
    },
  ])

  res.render("admin/admin_index", {
    todaySales,
    totalsales,
    revenue,
    Revenue,
    Orderpending,
    Ordershipped,
    Ordercancelled,
    salesCountByMonth
  });
};

exports.add_coupon = (req, res) => {
  res.render('admin/add_coupon')
}

exports.addCoupon = async (req, res) => {
  try {
    const {code, discount, expiryDate} = req.body
    const existingCoupon = await couponSchema.findOne({code:code})

    if(discount > 2000) {
      return res.render('admin/add_coupon', {message: 'Offer price exeedes, please decrease the amount!'})
    } else if(discount <= 0) {
      return res.render('admin/add_coupon', {message: 'Please add some discount to the coupon!'})
    }

    if(existingCoupon){
      return res.render('admin/add_coupon', {message: 'Coupon already exists!'})
      console.log('coupon is already existed');
    } else {
      const coupon = new couponSchema({
        code: req.body.code,
        startingDate: req.body.startingDate,
        expiryDate: req.body.expiryDate,
        discount: req.body.discount
      })
      console.log(coupon);
      await coupon.save();
      res.redirect('/coupon')
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: error.message || "Some error occurred while creating the coupon."
    })
  }
}

exports.coupon_page = async (req, res) => {
  try {
    const coupon = await couponSchema.find()
    res.render('admin/coupon_page', { coupon })
  } catch (error) {
      res.status(500).send("Server Error");
    };
};

exports.delete_coupon = async (req, res) => {
  try {
    const {id} = req.params
    const result = await couponSchema.findByIdAndRemove(id)
    if (result) {
      res.render('admin/coupon_page')
    } else {
      res.render('admin/coupon_page')
    }
  }catch (error) {
    res.status(500).send(error.message);
  }
}

exports.refund = async (req, res) => {
  const { id } = req.params

  try {
    const order = await orderSchema.findById(id).populate({ path: "items.product" })
    console.log("refund id:",id);
    console.log(order);

    if(!order) {
      return res.status(404).send({ message: "Order not found" })
    }

    const wallet = await walletSchema.findOne({ userId: order.user })

    if(wallet) {
      // User's wallet already exists, update the balance
      wallet.balance += order.total

      wallet.transactions.push(order.payment_method)

      await wallet.save()
    } else {
      const newWallet = new walletSchema({
        userId: order.user,
        orderId: order._id,
        balance: order.total,
        transactions: [order.payment_method]
      })

      await newWallet.save()
    }

    await orderSchema.updateOne({ _id: id }, { $set: { status: 'Amount refunded' } })

    res.redirect('/orders')
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
}

exports.sales_report = async (req, res) => {
  try {
    const admin = req.session.admin
    const filteredOrders = await orderSchema.find().populate("user").populate("items.product").populate("address")
    console.log(filteredOrders,"hhhdhdhh");
    res.render("admin/sales_report",{ admin, filteredOrders })

  } catch (error) {
    console.log(error);
    res.status(500).sent("Server Error")
  }
}

exports.salesReportFilter = async (req, res) => {
  const admin = req.session.admin
  const FromDate = req.body.fromdate
  console.log(FromDate);
  const Todate = req.body.todate
  console.log(Todate);
  const filteredOrders = await orderSchema.find({createdAt:{$gte:FromDate,$lte:Todate}}).populate("user").populate("items.product").populate("address")
 
  res.render("sales-report",{admin,filteredOrders})
}

exports.Banner=async(req,res)=>{
  const admin=req.session.admin
  const Banner_data=await bannerSchema.find().exec()
  res.render('admin/banner',{admin,Banner_data})
}
exports.addBanner=async(req,res)=>{
  const admin=req.session.admin
  res.render('admin/add_banner',{admin})
}

exports.add_banner=async(req,res)=>{
  try {
    const Banner = new bannerSchema({
      name: req.body.name,
      photo: req.files.map((file) => file.filename),
      date:req.body.date,
    });
    console.log(Banner);
    await Banner.save();

    const Banner_data=await bannerSchema.find().exec()
    res.render('admin/banner',{Banner_data})
  } catch (error) {
    console.log(error);
  }
 
}

exports.activateBanner = async (req, res) => {
  try {
    const id = req.params.id;
    await bannerSchema.findByIdAndUpdate(
      id,
      {
        status: true,
      },
      { new: true }
    );
    res.redirect("/banner");
  } catch (error) {
    console.log(error);
  }
};

exports.deactivateBanner = async (req, res) => {
  try {
    const id = req.params.id;
    await bannerSchema.findByIdAndUpdate(
      id,
      {
        status: false,
      },
      { new: true }
    );
    res.redirect("/banner");
  } catch (error) {
    console.log(error);
  }
};



