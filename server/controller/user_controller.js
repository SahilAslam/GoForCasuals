const userSchema = require("../model/user_model");
const productSchema = require("../model/product_model");
const cartSchema = require("../model/cart_model");
const orderSchema = require("../model/order_model");
const couponSchema = require("../model/coupon_model")
const walletSchema = require("../model/wallet_model")
const bannerSchema = require("../model/banner_model")
const wishlistSchema = require("../model/whishlist_model")
const fs = require("fs");
const bcrypt = require("bcrypt");
const { log } = require("console");
const paypal = require('paypal-rest-sdk')



exports.homeRoutes = async (req, res) => {
  const user = req.session.user;
  const userId = req.session.user?._id;
  console.log(user);
  const banner = await bannerSchema.find()
  const product = await productSchema.find().limit(12);
  const cart = await cartSchema
        .findOne({ userId: userId })
        .populate("products.productId");
      if (cart) {
        let products = cart.products;
        console.log(products);
        res.render("user/index", { banner, user, product, cart, products });
      } else {
        res.render("user/index", { banner, user, product });
      }  
  
};

exports.userLogin = (req, res) => {
  const user = req.session.user;
  if (user) {
    res.redirect("/");
  } else {
    res.render("user/login");
  }
};

exports.userSignup = (req, res) => {
  res.render("user/signup");
};

exports.createUser = async (req, res) => {
  const existingEmail = await userSchema.find({ email: req.body.email });

  const existingPhone = await userSchema.find({ phone: req.body.phone });

  if (existingEmail.length > 0) {
    return res.render('user/signup', { msg: "Email allready exists" });
  }

  if (existingPhone.length > 0) {
    return res.render('user/signup', { msg: "Mobile allready exists" });
  }

  

  const saltRounds = 10;
  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    if (err) {
      res.status(500).send({
        message:
          err.message || "Some error occurred while hashing the password",
      });
      return;
    }
    const user = new userSchema({
      name: req.body.name,
      username: req.body.username,
      email: req.body.email,
      phone: req.body.phone,
      password: hash,
    });
    user.save()
      .then(() => {
        res.render("user/login", { message: "Successfully registered" });
      })
      .catch((err) => {
        res.status(500).send({
          message:
            err.message ||
            "Some error occurred while creating a create operation",
        });
      });
  });
};


exports.user_login = async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const user = await userSchema.findOne({ email: email });
    const product = await productSchema.find().limit(12);
    const banner = await bannerSchema.find()
    if (user) {
      if (user.isBlocked) {
        return res.render("user/login", { message: "Blocked User" });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        req.session.user = user;
        // req.session.userId=user._id
        return res.render("user/index", { user, product, banner });
      } else {
        return res.render("user/login", {
          message: "Incorrect password, please try again",
        });
      }
    } else {
      return res.render("user/login", {
        message: "User not found, please register",
      });
    }
  } catch (error) {
    console.error(error);
    res.send("An error occurred while logging in.");
  }
};

exports.shop_page = async (req, res) => {
  const user = req.session.user;
  const product = await productSchema.find() 
  // const user = await userSchema.findOne({username:sessionUser})
  res.render("user/shop", { product, user });
};

exports.logout = (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
      res.send("error");
    } else {
      res.render("user/login");
    }
  });
};

exports.product_view = async (req, res) => {
  if (req.session.user) {   
    try {
      const user = req.session.user;
      const { id } = req.params;

      const products = await productSchema.find() 
      const product = await productSchema.findById(id);

      if (!product) {
        console.log("product not found");     
        res.redirect("/shop");
      }
      return res.render("user/product_details", { product, user, products });

    } catch (error) {
      console.error(error);
      res.redirect("/shop");
    }
  } else {
    res.redirect("/login")
  }
};

exports.userCart = async (req, res) => {
  const user = req.session.user;
  if (user) {
    try {
      const userId = req.session.user?._id;
      const data = await userSchema.findOne({ _id: userId });
      const cart = await cartSchema
        .findOne({ userId: userId })
        .populate("products.productId");
      if (cart) {
        let products = cart.products;
        res.render("user/cart", { cart, user, products, data: data.address });
      } else {
        res.render("user/cart");
      }
      // res.render('user/cart',{user,products})
    } catch (error) {
      console.error(error);
      res.status(500).send("Some Error occurred");
    }
  } else {
    res.redirect("/login");
  }
};

exports.add_to_cart = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const productId = req.params.id;

    let userCart = await cartSchema.findOne({ userId: userId });

    if (!userCart) {
      // If the user's cart doesn't exist, create a new cart
      const newCart = new cartSchema({ userId: userId, products: [] });
      await newCart.save();
      userCart = newCart;
    }

    const productIndex = userCart.products.findIndex(
      (product) => product.productId == productId
    );

    console.log(productIndex);

    if (productIndex === -1) {
      // If the product is not in the cart, add it
      userCart.products.push({ productId, quantity: 1 });
    } else {
      // If the product is already in the cart, increase its quantity by 1
      userCart.products[productIndex].quantity += 1;
    }
    await userCart.save();
    res.status(200).json( {message: 'Product added to the cart successfully'})
    // res.redirect("/product_list");
    console.log("Product added to cart successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteCartItem = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user?._id;
    const productDeleted = await cartSchema.findOneAndUpdate(
      { userId: userId },
      { $pull: { products: { productId: productId } } },
      { new: true }
    );
    if (productDeleted) {
      res.redirect("/cart");
    } else {
      console.log("product not deleted");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

exports.incrementQuantity = async (req, res) => {
  console.log("quantity incremented");
  const userId = req.session.user?._id;
  const cartId = req.body.cartId;
  console.log(userId);

  try {
    let cart = await cartSchema
      .findOne({ userId: userId })
      .populate("products.productId");

    let cartIndex = cart.products.findIndex((items) =>
      items.productId.equals(cartId)
    );

    if (cartIndex === -1) {
      return res.json({ success: false, message: "Cart item not found." });
    }

    cart.products[cartIndex].quantity += 1;
    const products = cart.products[cartIndex].productId;
    const maxQuantity = products.stock;
    console.log(maxQuantity,"/////////////");

    if(cart.products[cartIndex].quantity > maxQuantity) {
      return res.json({
        success: false,
        message: "Maximum quantity reached.",
        maxQuantity
      });
    }

    await cart.save();
    

    const total =
      cart.products[cartIndex].quantity *
      cart.products[cartIndex].productId.price;
    const quantity = cart.products[cartIndex].quantity;

    res.json({
      success: true,
      message: "Quantity updated",
      total,
      quantity,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Failed to update quantity" });
  }
};

exports.decrementQuantity = async (req, res) => {
  console.log("quantity decremented");
  const cartItemId = req.body.cartItemId;
  const userId = req.session.user?._id;
  try {
    const cart = await cartSchema
      .findOne({ userId: userId })
      .populate("products.productId");
    const cartIndex = cart.products.findIndex((item) =>
      item.productId.equals(cartItemId)
    );
    if (cartIndex === -1) {
      return res.json({ success: false, message: "cart item not found" });
    }
    cart.products[cartIndex].quantity -= 1;
    await cart.save();
    const total =
      cart.products[cartIndex].quantity *
      cart.products[cartIndex].productId.price;
    const quantity = cart.products[cartIndex].quantity;
    res.json({
      success: true,
      message: "Quantity updated successfully",
      total,
      quantity,
    });
  } catch (error) {
    res.json({ success: false, message: "Failed to update Quantity" });
  }
};

exports.userAddress = async (req, res) => {
  const user = req.session.user;
  if (user) {
    try {
      const userId = req.session.user?._id;
      const data = await userSchema.findOne({ _id: userId });
      res.render("user/user_address", { data: data.address, user });
    } catch (error) {
      console.error(error);
      res.status(500).send("Some Error occurred");
    }
  } else {
    res.redirect("/login");
  }
};

exports.addAddress = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const { name, phone, address, pincode, city, state } = req.body;

    // Find the user by a specific identifier
    const user = await userSchema.findOne({ _id: userId });
    console.log(user);

    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    // Push the new address data to the existing address array
    user.address.push({ name, phone, address, pincode, city, state });

    // Save the updated user document
    await user.save();
    res.redirect("/userAddress");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error finding/updating user.");
  }
};

exports.update_address = async (req, res) => {
  try {
    const id = req.params.id
    const userId = req.session.user?._id
    const { name, address, phone, pincode, city, state } = req.body

    // Find the user by their ID
    const user = await userSchema.findById(userId)

    if(!user) {
      return res.status(400).send({error: 'User not found'})
    }

    // Find the address to update
    const update = user.address.id(id)

    if(!update) {
      return res.status(400).send({error: 'Address not found'})      
    }

    // Update the address properties
    update.name = name
    update.address = address
    update.phone = phone
    update.pincode = pincode
    update.city = city
    update.state = state

    // Save the updated user
    await user.save()

    res.redirect("/userAddress")

  } catch (error) {
    console.error(error)
    return res.status(500).send({error: 'Server error'})
  }
}

exports.checkout_page = async (req, res) => {
  if (req.session.user) {
    try {
      const payment = req.body.payment_method;
      const id = req.params.id;
      const userId = req.session.user?._id;
      const data = await userSchema.findOne({ _id: userId });
      const user = await userSchema.findOne(
        { _id: userId },
        { address: { $elemMatch: { _id: id } } }
      );
      const coupon = await couponSchema.find()
      const cart = await cartSchema
        .findOne({ userId: user })
        .populate("products.productId");
      console.log(cart);
      console.log(user);
      if (user) {
        const address = user.address[0]; 
        console.log(address);
        res.render("user/checkout", { user, cart, address, coupon });
      } else {
        res.status(404).send("Address not found");
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("server error");
    }
  } else {
    res.redirect("/login");
  }
};

let paypalTotal = 0
exports.checkout = async (req, res) => {
  const user = req.session.user;
  if (user) {
    try {
      const id = req.params.id;
      const userId = req.session.user?._id;
      const payment = req.body.payment;
      const Currentuser = await userSchema.findOne({ _id: userId });
      const wallet = await walletSchema.findOne({ userId: userId })
      if (!Currentuser) {
        return res.status(404).send('User not found');
      }
    const addressIndex = Currentuser.address.findIndex((item)=> item._id.equals(id))

    const specifiedAddress = Currentuser.address[addressIndex]

      if (!specifiedAddress) {
        return res.status(404).send('Address not found');
      }

      const cart = await cartSchema
        .findOne({ userId: userId })
        .populate("products.productId");

      cart ? console.log(cart) : console.log("Cart not found");

      const discount = cart.total
      const wallet_balance = cart.wallet

      const items = cart.products.map((item) => {
        const product = item.productId;
        const quantity = item.quantity;
        const price = product.price;


        if (!price) {
          throw new Error("Product price is required");
        }
        if (!product) {
          throw new Error("Product is required");
        }
        return {
          product: product._id,
          quantity: quantity,
          price: price,
        };
      });
      console.log(items);

      let totalPrice = 0;
      items.forEach((item) => {
        totalPrice += item.price * item.quantity;
      });
      if(discount){
        totalPrice -= discount
      }
      if(wallet_balance) {
        totalPrice -= wallet_balance
      }
      if (payment == "cod") {
        const order = new orderSchema({
          user: userId,
          items: items,
          total: totalPrice,
          status: "Pending",
          payment_method: payment,
          createdAt: new Date(),
          address: specifiedAddress,
        });
        await order.save();
        try {
          wallet.balance -= wallet_balance
    
         
          await wallet.save();
          
        } catch (error) {
          console.log(error);
        }
  
        await cartSchema.deleteOne({ userId: userId });
  
        res.render("user/order_confirm", {user,userId});

      } else if (payment == "paypal") {
        const order = new orderSchema({
          user: userId,
          items: items,
          total: totalPrice,
          status: "Pending",
          payment_method: payment,
          createdAt: new Date(),
          address: specifiedAddress,
        })
        await order.save()

        cart.products.forEach((element) => {
          paypalTotal += totalPrice
        })

        let createPayment = {
          intent: "sale",
          payer: { payment_method: "paypal" },
          redirect_urls: {
            return_url: `http://goforcasuals.shop/paypal-success/${userId}`,
            cancel_url: "http://goforcasuals.shop/paypal-err",
          },
          transactions: [ 
            {
              amount: {
                currency: "USD",
                total: (paypalTotal / 82).toFixed(2), // Divide by 82 to convert to USD
              },
              description: "Super User Paypal Payment",
            },
          ],
        };

        paypal.payment.create(createPayment, function (error, payment) {
          if (error) {
            console.log(error);
            throw error;
            
          } else {
            for (let i = 0; i < payment.links.length; i++) {
              if (payment.links[i].rel === "approval_url") {
                res.redirect(payment.links[i].href);
              }
            }
          }
        });
        await cartSchema.deleteOne({ userId: userId });
        
      }
      
    } catch (error) {
      console.log(error);
      res.status(500).send("Checkout failed!");
    }
  } else {
    res.redirect("/login")
  }
};

exports.paypal_success = async (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  const userId = req.params.id
  const user = await userSchema.findOne({ _id: userId })

  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
      "amount": {
        "currency": "USD",
        "total": paypalTotal
      }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function(error, payment) {
    if (error) {
      if (error.response && error.response.name === 'PAYER_ACTION_REQUIRED') {
        // Redirect the buyer to the PayPal resolution link
        const resolutionLink = error.response.links.find(link => link.rel === 'https://uri.paypal.com/rel/resolution');
        if (resolutionLink) {
          res.redirect(resolutionLink.href);
        } else {
          // Handle the case when resolution link is not available
          console.log('Resolution link not found.');
          throw error;
        }
      } else {
        console.log(error);
        throw error;
      }
    } else {
      console.log(JSON.stringify(payment));
      req.session.user = user;
      console.log(user);
      res.render("user/paypal_success", { payment, user, userId });
    }
  });
};



exports.paypal_err = (req, res) => {
  console.log("Hi Error");
  console.log(req.query)
  res.send("error")
}

exports.orderConfirm = (req, res) => {
  res.render("user/order_confirm");
};

exports.orderDetails = async (req, res) => {
  if (req.session.user) {
    const user = req.session.user;
    const userId = req.session.user?._id;

    const orders = await orderSchema
      .find({ user: userId })
      .populate("user")
      .populate("items.product");
    res.render("user/order_details", { orders, user });
  } else {
    res.redirect("/login");
  }
};

exports.cancelOrder = async (req, res) => {
  const user = req.session.user;
  if (user) {
    try {
      const id = req.params.id;
      const order = await orderSchema.findByIdAndUpdate(
        id,
        {
          status: "Cancelled",
        },
        { new: true }
      );
      res.redirect("/orderDetails");
    } catch (error) {
      console.log(error);
      res.status(501).send("Server Error");
    }
  } else {
    res.redirect("/login");
  }
};

exports.returnOrder = async (req, res) => {
  const user = req.session.user;
  if (user) {
    try {
      const id = req.params.id;
      const order = await orderSchema.findByIdAndUpdate(
        id,
        {
          status: "Returned",
        },
        { new: true }
      );
      res.redirect("/orderDetails");
    } catch (error) {
      console.log(error);
      res.status(501).send("Server Error");
    }
  } else {
    res.redirect("/login");
  }
}

exports.order_view = async (req, res) => {
  if(req.session.user) {
    try {
      const user = req.session.user
      const id = req.params.id

      const order = await orderSchema.findById(id).populate('user').populate('items.product').populate('items.quantity')
      res.render("user/order_view",{order, user})
    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error")
    }
  } else {
    res.redirect("/")
  } 
}

exports.order_invoice = async (req, res) => {
  if(req.session.user){
    try {
      const {id}= req.params
      const user = req.session.user

      const order = await orderSchema.findById(id).populate('user').populate('items.product').populate('items.quantity')

      res.render("user/order_invoice",{order,user})
      
    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error")
    }
  } else {
    res.redirect("/")
  }
}

exports.user_profile = async (req, res) => {  
  if (req.session.user) {
    const user = req.session.user;
    const userId = req.session.user?._id;
    const id = req.params.id
    const userData = await userSchema.findOne({ _id: userId })

    // const orders = await orderSchema.findOne({ user: userId }).populate("user").populate("items.product");
    console.log(user);
    
    res.render('user/user_profile', {user, userData, addressData: userData.address})

  } else {
    res.redirect("/login");
  }
}

exports.redeem_coupon = async (req, res) => {
  const { coupon } = req.body;
  console.log(coupon);
  const userId = req.session.user?._id;
  console.log(userId);

  const findCoupon = await couponSchema.findOne({ code: coupon })
  const userCoupon = await userSchema.findOne({_id: userId})

  if(userCoupon.coupon.includes(coupon)) {
    return res.json({
      success: false,
      message: "Coupon Already used"
    })
  }

  if(!findCoupon || findCoupon.status === false) {
    return res.json({
      success: false,
      message: findCoupon ? "Coupon Deactivated" : "Coupon not found",
    })
  }

  userCoupon.coupon.push(coupon)
  await userCoupon.save()

  const currentDate = new Date()
  const startingDate = new Date(findCoupon.startingDate)
  const expiryDate = new Date(findCoupon.expiryDate)


  if(currentDate > expiryDate) {
    return res.json({
      success: false,
      message: "Coupon Expired"
    })
  } else if(currentDate < startingDate) {
    return res.json({
      success: false,
      message: "Coupon hasn't bigginned yet, wait for it"
    })
  }

  const amount = findCoupon.discount

  res.json({
    success: true,
    message: "Coupon available",
    findCoupon,
    amount: parseInt(amount)
  })

  try {
    const cart = await cartSchema.findOne({ user: userId })
    cart.total = amount

    if(!cart) {
      console.log("Cart not found");
      return;
    }

    cart.total = amount
    await cart.save()
  } catch (error) {
    console.error("Error updating cart:", error);
  }  
}

exports.user_wallet = async (req, res) => {
  if(req.session.user){
    try {
      const userId = req.session.user?._id
      const user = req.session.user
      let sum = 0

      const walletbalance = await walletSchema.findOne({ userId: userId }).populate('orderId');
      const orderdetails = await orderSchema.find({ user: userId , status: "Amount refunded" }).populate('items.product');

      if (walletbalance) {
        sum += walletbalance.balance;
        const wallet = walletbalance.orderId
        res.render("user/user_wallet", { user, wallet, sum, walletbalance, orderdetails })
      } else {
        res.render('user/user_wallet', { user, wallet: null, sum, walletbalance: null, orderdetails });
      }


    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error")
    }
  } else {
    res.redirect("/login")
  }
}

exports.wallet_pay = async(req,res)=>{
  if(req.session.user){
    try{
      const userId = req.session.user._id
      const wallet = await walletSchema.findOne({ userId: userId });
      const cart = await cartSchema.findOne({userId:userId}).populate("products.productId")
      let totalprice=0
  
      const items = cart.products.map((item) => {
        const product = item.productId;
        const quantity = item.quantity;
        const price = item.productId.price
          
        totalprice += price * quantity;   
      })
  
      console.log(totalprice,"kk q");
      const balance = (10 / 100) * totalprice;
  
      let wallet_balance= wallet.balance
      if (balance <  wallet.balance) {
        totalprice -= balance;
        cart.wallet = balance;
        await cart.save();
       
 
        console.log( wallet.balance,"after");
      }
      res.json({
        success: true,
        message: "Wallet add Successful",
        totalprice,
        wallet_balance
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.redirect("/login")
  }
};

exports.lowToHigh = async (req, res) => {
  if(req.session.user) {
    const pageSize = 12;
    const currentPage = parseInt(req.query.page) || 1;
    try {
      const user = req.session.user;
      const user_id = req.session.user_id;
      const totalProducts = await productSchema.countDocuments();
      const totalPages = Math.ceil(totalProducts / pageSize);
      const skip = (currentPage - 1) * pageSize;
      const product = await productSchema
        .find()
        .sort({ price: 1 })
        .skip(skip)
        .limit(pageSize);
      res.render("user/shop", { product, user, user_id, totalPages, currentPage });
              
    } catch (error) {
      console.error("Error fetching products:", error);
      res.render("error", { message: "Error fetching products" });
    }
  } else {
    res.redirect("/login")
  }
}

exports.highToLow = async (req, res) => {
  if(req.session.user) {
    const pageSize = 12;
    const currentPage = parseInt(req.query.page) || 1;

    try {
      const user = req.session.user;
      const user_id = req.session.user_id;
      const totalProducts = await productSchema.countDocuments();
      const totalPages = Math.ceil(totalProducts / pageSize);
      const skip = (currentPage - 1) * pageSize;
      const product = await productSchema
        .find()
        .sort({ price: -1 })
        .skip(skip)
        .limit(pageSize);
      res.render("user/shop", { product, user, user_id, totalPages, currentPage, });

    } catch (error) {
      console.error("Error fetching products:", error);
      res.render("error", { message: "Error fetching products" });
    }
  } else {
    res.redirect("/login")
  }  
};

exports.userDetailsEdit = async (req,res)=>{
  try {
    const {id}= req.params
    const {name,email,mobile} = req.body

    const userdetails = await userSchema.findByIdAndUpdate(id,{
      name:name,
      email:email,
      mobile:mobile
    })

    if (userdetails) {
      res.redirect("/user_profile")
    }

    
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Server error' });
  }
}

exports.user_profile_address = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const { name, phone, address, pincode, city, state } = req.body;

    // Find the user by a specific identifier
    const user = await userSchema.findOne({ _id: userId });
    console.log(user);

    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    // Push the new address data to the existing address array
    user.address.push({ name, phone, address, pincode, city, state });

    // Save the updated user document
    await user.save();
    res.redirect("/user_profile");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error finding/updating user.");
  }
};

exports.user_profile_address_edit = async (req, res) => {
  try {
    const id = req.params.id
    const userId = req.session.user?._id
    const { name, address, phone, pincode, city, state } = req.body

    // Find the user by their ID
    const user = await userSchema.findById(userId)

    if(!user) {
      return res.status(400).send({error: 'User not found'})
    }

    // Find the address to update
    const update = user.address.id(id)

    if(!update) {
      return res.status(400).send({error: 'Address not found'})      
    }

    // Update the address properties
    update.name = name
    update.address = address
    update.phone = phone
    update.pincode = pincode
    update.city = city
    update.state = state

    // Save the updated user
    await user.save()

    res.redirect("/user_profile")

  } catch (error) {
    console.error(error)
    return res.status(500).send({error: 'Server error'})
  }
}

exports.deleteAddress = async (req,res) =>{
  try {
    // Find the user document by ID
    const userId = req.session.user?._id
    const addressId = req.params.id

    const user = await userSchema.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the index of the address with the specified _id in the array
    const addressIndex = user.address.findIndex(address => address._id.toString() === addressId);

    if (addressIndex === -1) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Remove the address from the array
    user.address.splice(addressIndex, 1);

    // Save the updated user document
    await user.save();

    res.redirect('/user_profile'); // Redirect to a suitable page after successful deletion
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}

exports.wishlist = async  (req,res)=>{
  if (req.session.user) {
    try {
      const user = req.session.user
      const userId = req.session.user?._id

      const wishlistData = await wishlistSchema.findOne({userId:userId}).populate('products.productId')

      if(wishlistData!==null){
        let products = wishlistData.products
        res.render("user/wishlist",{user,products,wishlistData})
      }else{
        res.render("user/wishlist",{user,wishlistData})

      }

        
      } catch (error) {
        console.log(error);
      }
  }else{
    res.redirect("/login")
  }
}

exports.addToWishlist = async (req,res)=>{
  try {
    console.log("yudedtytydtyewfewy");
    const productId = req.params.id
    console.log(productId,"//////////////");
    const userId = req.session.user?._id


    let userWishlist = await wishlistSchema.findOne({userId:userId})
    console.log(userWishlist,"yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy")

  if (!userWishlist) {
      // If the user's wishlist doesn't exist create new one
      let newWishlist = new wishlistSchema({ userId: userId, products: [] });
      await newWishlist.save();
      console.log(newWishlist,"////////////////////////////////////////////////");
      userWishlist = newWishlist;

  }

  const productIndex = userWishlist.products.findIndex(
      (product) => product.productId == productId

  );
  

  if (productIndex === -1) {
    // If the product is not in the wishlist, add it
    userWishlist.products.push({ productId: productId, quantity: 1 });
  } else {
    // If the product is already in the wishlist, increase its quantity by 1
    userWishlist.products[productIndex].quantity += 1;
  }
  
  

  const result = await userWishlist.save();


  res.status(200).json({ message: 'Product added to wishlist successfully' });

  } catch (error) {
    console.log(error);
  }
}

exports.removeItemWishlist = async (req,res)=>{
  try {
    const productId = req.params.id
    const userId= req.session.user?._id
    

    const productDeleted = await wishlistSchema.findOneAndUpdate(
        {userId: userId},
        {$pull:{ products:{productId: productId}}},
        {new: true}
    )
    
    if(productDeleted){
      res.json({
        success:true,
        message:"Remove item",
      })
    }else{
       
        res.json({
          success:false,
          message:"failed to Remove item",
        })
    }

  } catch (error) {
      console.log(error);
      res.status(500).send("Server Error")
      
  }
}