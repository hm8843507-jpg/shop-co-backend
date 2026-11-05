const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    cart_id: { type: String, required: true, trim: true, maxlength: 64 },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

cartSchema.index({ cart_id: 1, product_id: 1, size: 1 }, { unique: true });

module.exports = mongoose.models.Cart || mongoose.model('Cart', cartSchema);
