import Order from "../models/Order.js"
import Product from "../models/Product.js"
import mongoose from "mongoose";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import { transporter } from "../utils/sendMail.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Place Order COD : /api/orders/cod
export const placeOrderCOD = async (req, res) => {
    try {
        const userId = req.id; // Get userId from authenticated user
        const { email, items, address } = req.body;

        // Validation check
        if (!address || !items || items.length === 0) {
            return res.json({ success: false, message: "Invalid data" });
        }

        let amount = 0;

        // Loop through items to calculate total amount
        for (let item of items) {
            if (isValidObjectId(item.product)) {
                const product = await Product.findById(item.product);
                if (!product) {
                    return res.json({ success: false, message: "Product not found" });
                }
                amount += product.offerPrice * item.quantity;
            } else {
                const snapPrice = Number(item?.productData?.offerPrice);
                if (!Number.isFinite(snapPrice) || snapPrice <= 0) {
                    return res.json({ success: false, message: `Invalid product in cart: ${item.product}` });
                }
                amount += snapPrice * item.quantity;
            }
        }

        // Add tax (2%)
        amount += Math.floor(amount * 0.02);

        // Create the order
        await Order.create({
            userId,
            items,
            address,
            amount,
            paymentType: "COD", // Payment type set to COD
            isPaid: true, // Assuming COD orders are marked as paid
        });

        //Send confirmation email (optional)
        try {
            await transporter.sendMail({
                to: email || req.user?.email,
                subject: "Order Confirmation",
                text: `Your order has been placed successfully. Order ID: ${userId}`,
            });
        } catch (emailError) {
            console.log("Email sending failed:", emailError.message);
            // Don't fail the order if email fails
        }
        
        return res.json({ success: true, message: "Order Placed Successfully" });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Place Order Online : /api/orders/stripe
export const placeOrderStripe = async (req, res) => {
    try {
      const userId = req.id; // Get userId from authenticated user
      const { items, address } = req.body;
      const origin = req.headers.origin || req.headers.referer || process.env.Frontend_URL || 'http://localhost:5173';
  
      if (!address || !items || items.length === 0) {
        return res.json({ success: false, message: "Invalid data" });
      }
  
      let productData = [];
      let totalAmount = 0;
  
      // Prepare line items and calculate tax-inclusive total
      for (let item of items) {
        let name;
        let offerPrice;

        if (isValidObjectId(item.product)) {
          const product = await Product.findById(item.product);
          if (!product) {
            return res.json({ success: false, message: "Product not found" });
          }
          name = product.name;
          offerPrice = product.offerPrice;
        } else {
          name = item?.productData?.name;
          offerPrice = Number(item?.productData?.offerPrice);
          if (!name || !Number.isFinite(offerPrice) || offerPrice <= 0) {
            return res.json({ success: false, message: `Invalid product in cart: ${item.product}` });
          }
        }

        const priceWithTax = parseFloat((offerPrice * 1.02).toFixed(2));
        totalAmount += priceWithTax * item.quantity;
  
        productData.push({
          name,
          price: priceWithTax,
          quantity: item.quantity,
        });
      }
  
      // Stripe expects amount in cents
      const line_items = productData.map((item) => ({
        price_data: {
          // Use INR by default to match the UI currency
          currency: (process.env.STRIPE_CURRENCY || "inr").toLowerCase(),
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100), // cents
        },
        quantity: item.quantity,
      }));
  
      // Create a pending order BEFORE redirecting to Stripe so it shows up in User/Seller dashboards.
      // If you add webhook later, you can mark this paid using session.id.
      const pendingAmount = Math.floor((totalAmount) * 100) / 100;
      const orderDoc = await Order.create({
        userId,
        items,
        address,
        amount: pendingAmount,
        paymentType: "Online",
        isPaid: false,
        status: "Payment Pending",
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items,
        success_url: `${origin}/loader?next=my-orders`,
        cancel_url: `${origin}/cart`,
        metadata: {
          userId,
          addressId: address,
          items: JSON.stringify(items),
          orderId: String(orderDoc._id),
          // optional: you can also include a hash or checksum to validate later
        },
      });

      // Save session id for later reconciliation (webhook)
      await Order.findByIdAndUpdate(orderDoc._id, { stripeSessionId: session.id });
  
      return res.json({success:true, url: session.url})

    } catch (error){
        return res.json({success: false, message: error.message})
    }
}

// Stripe Webhook Handler : /api/orders/stripe-webhook
export const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { userId, addressId, items, orderId } = session.metadata;

        try {
            let amount = 0;
            const parsedItems = JSON.parse(items);

            // Calculate total amount
            for (let item of parsedItems) {
                if (isValidObjectId(item.product)) {
                    const product = await Product.findById(item.product);
                    if (product) {
                        amount += product.offerPrice * item.quantity;
                    }
                } else {
                    const snapPrice = Number(item?.productData?.offerPrice);
                    if (Number.isFinite(snapPrice) && snapPrice > 0) {
                        amount += snapPrice * item.quantity;
                    }
                }
            }
            amount += Math.floor(amount * 0.02); // Add tax

            // Prefer updating the pending order if it exists
            if (orderId) {
              await Order.findByIdAndUpdate(orderId, {
                isPaid: true,
                status: "Order Placed",
              });
            } else {
              // Fallback: create if not found (older sessions)
              await Order.create({
                  userId,
                  items: parsedItems,
                  address: addressId,
                  amount,
                  paymentType: "Online",
                  isPaid: true,
              });
            }

            console.log(`Order created for user ${userId} via Stripe`);
        } catch (error) {
            console.log("Error creating order from webhook:", error.message);
        }
    }

    res.json({ received: true });
}

// Get Orders by UserId : /api/orders/user
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.id
        // Don't populate items.product because many ids are not ObjectIds in this project
        const orders = await Order.find({ userId }).sort({createdAt: -1})
        return res.json({success: true, orders})
    } catch (error) {
        return res.json({success: false, message: error.message})
    }
}

// Get All Orders : /api/orders/seller
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate("address").sort({createdAt: -1})
        return res.json({success: true, orders})
    } catch (error) {
        return res.json({success: false, message: error.message})
    }
}