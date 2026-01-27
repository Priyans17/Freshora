import Order from "../models/Order.js"
import Product from "../models/Product.js"
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import { transporter } from "../utils/sendMail.js";

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
            const product = await Product.findById(item.product);
            if (!product) {
                return res.json({ success: false, message: "Product not found" });
            }
            amount += product.offerPrice * item.quantity;
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
        const product = await Product.findById(item.product);
        if (!product) {
          return res.json({ success: false, message: "Product not found" });
        }
  
        const priceWithTax = parseFloat((product.offerPrice * 1.02).toFixed(2));
        totalAmount += priceWithTax * item.quantity;
  
        productData.push({
          name: product.name,
          price: priceWithTax,
          quantity: item.quantity,
        });
      }
  
      // Stripe expects amount in cents
      const line_items = productData.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100), // cents
        },
        quantity: item.quantity,
      }));
  
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
          // optional: you can also include a hash or checksum to validate later
        },
      });
  
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
        const { userId, addressId, items } = session.metadata;

        try {
            let amount = 0;
            const parsedItems = JSON.parse(items);

            // Calculate total amount
            for (let item of parsedItems) {
                const product = await Product.findById(item.product);
                if (product) {
                    amount += product.offerPrice * item.quantity;
                }
            }
            amount += Math.floor(amount * 0.02); // Add tax

            // Create the order
            await Order.create({
                userId,
                items: parsedItems,
                address: addressId,
                amount,
                paymentType: "Online",
                isPaid: true,
            });

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
        const orders = await Order.find({
            userId,
            $or: [{paymentType: "COD"}, {isPaid: true}]
        }).populate("items.product").sort({createdAt: -1})
        return res.json({success: true, orders})
    } catch (error) {
        return res.json({success: false, message: error.message})
    }
}

// Get All Orders : /api/orders/seller
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [{paymentType: "COD"}, {isPaid: true}]
        }).populate("items.product").populate("address").sort({createdAt: -1})
        return res.json({success: true, orders})
    } catch (error) {
        return res.json({success: false, message: error.message})
    }
}