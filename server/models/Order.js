import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId:{
        type: String, 
        required: true, 
        ref: 'user'
    },
    items: [{
        product: {
            type: String, 
            required: true, 
            ref: 'product'
        },
        // snapshot for non-DB / non-ObjectId products
        productData: {
            name: { type: String },
            offerPrice: { type: Number },
            image: { type: String },
            category: { type: String },
        },
        quantity: {
            type: Number, 
            required: true
        }
    }],
    amount: {
        type: Number, 
        required: true
    },
    address: {
        type: String, 
        required: true, 
        ref: 'address'
    },
    status: {
        type: String, 
        required: true, 
        default: 'Order Placed'
    },
    paymentType: {
        type: String, 
        required: true
    },
    stripeSessionId: {
        type: String,
        default: null,
    },
    isPaid: {
        type: Boolean, 
        required: true,
        default: false
    },
},{timestamps: true})

const Order = mongoose.models.order || mongoose.model('order', orderSchema)

export default Order