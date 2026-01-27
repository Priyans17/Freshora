import express from 'express';
import authUser from '../middlewares/authUser.js';
import { getAllOrders, getUserOrders, placeOrderCOD, placeOrderStripe, stripeWebhook } from '../controllers/orderController.js';
import authSeller from '../middlewares/authSeller.js';


const orderRouter = express.Router();
orderRouter.post('/cod', authUser, placeOrderCOD); // Place Order COD
orderRouter.get('/user', authUser, getUserOrders); // Get user orders
orderRouter.get('/seller', authSeller, getAllOrders); // Get all orders for seller
orderRouter.post('/stripe', authUser, placeOrderStripe); // Place Order with Stripe
// Webhook route - must be before express.json() middleware in server.js
orderRouter.post('/stripe-webhook', express.raw({type: 'application/json'}), stripeWebhook); // Stripe webhook

export default orderRouter;