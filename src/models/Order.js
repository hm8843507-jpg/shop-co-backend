const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    order_id: { type: String, required: true, unique: true },
    customer_name: { type: String, required: true, trim: true },
    total_amount: { type: Number, required: true, min: 0 },
    items: { type: [orderItemSchema], default: [] },
    discount_amount: { type: Number, default: 0, min: 0 },
    delivery_fee: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['Pending', 'Shipped', 'Cancelled'], default: 'Pending' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

orderSchema.methods.toClient = function toClient() {
  return {
    id: String(this._id),
    _id: String(this._id),
    order_id: this.order_id,
    customer_name: this.customer_name,
    total_amount: this.total_amount,
    items: this.items,
    discount_amount: this.discount_amount,
    delivery_fee: this.delivery_fee,
    status: this.status,
    created_at: this.createdAt,
  };
};

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
