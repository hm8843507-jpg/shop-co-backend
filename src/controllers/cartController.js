const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

function parseCartId(value) {
  if (typeof value !== 'string') return null;
  const cartId = value.trim().toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(cartId)
    ? cartId
    : null;
}

function toClientItem(item) {
  const product = item.product_id;
  if (!product || typeof product.toClient !== 'function') return null;

  return {
    id: String(item._id),
    product_id: String(product._id),
    quantity: item.quantity,
    size: item.size,
    product: product.toClient(),
  };
}

async function getCart(req, res) {
  const cartId = parseCartId(req.query.cart_id);
  if (!cartId) return res.status(400).json({ message: 'A valid cart ID is required.' });

  try {
    const items = await Cart.find({ cart_id: cartId }).populate('product_id');
    return res.json({ items: items.map(toClientItem).filter(Boolean) });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ message: 'Unable to load your cart.' });
  }
}

async function addCartItem(req, res) {
  const cartId = parseCartId(req.body?.cart_id);
  const { product_id: productId, quantity, size } = req.body || {};
  if (!cartId) return res.status(400).json({ message: 'A valid cart ID is required.' });
  if (
    !mongoose.Types.ObjectId.isValid(productId) ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    typeof size !== 'string' ||
    !size.trim()
  ) {
    return res.status(400).json({ message: 'A valid product, quantity, and size are required.' });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    if (!product.sizes.includes(size.trim())) {
      return res.status(400).json({ message: `${product.name} is not available in size ${size.trim()}.` });
    }

    const totals = await Cart.aggregate([
      { $match: { cart_id: cartId, product_id: product._id } },
      { $group: { _id: null, quantity: { $sum: '$quantity' } } },
    ]);
    const currentQuantity = totals[0]?.quantity || 0;
    if (currentQuantity + quantity > product.stock) {
      return res.status(409).json({ message: `${product.name} does not have enough stock.` });
    }

    let item = await Cart.findOneAndUpdate(
      { cart_id: cartId, product_id: product._id, size: size.trim() },
      { $inc: { quantity } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    item = await item.populate('product_id');
    return res.status(200).json({ message: 'Cart updated.', item: toClientItem(item) });
  } catch (error) {
    console.error('Add cart item error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Your cart changed. Please retry the request.' });
    }
    return res.status(500).json({ message: 'Unable to add this item to your cart.' });
  }
}

async function updateCartItem(req, res) {
  const cartId = parseCartId(req.body?.cart_id);
  const { quantity } = req.body || {};
  if (!cartId) return res.status(400).json({ message: 'A valid cart ID is required.' });
  if (!mongoose.Types.ObjectId.isValid(req.params.id) || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ message: 'A valid cart item and quantity are required.' });
  }

  try {
    const item = await Cart.findOne({ _id: req.params.id, cart_id: cartId });
    if (!item) return res.status(404).json({ message: 'Cart item not found.' });

    const product = await Product.findById(item.product_id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const totals = await Cart.aggregate([
      { $match: { cart_id: cartId, product_id: item.product_id, _id: { $ne: item._id } } },
      { $group: { _id: null, quantity: { $sum: '$quantity' } } },
    ]);
    if ((totals[0]?.quantity || 0) + quantity > product.stock) {
      return res.status(409).json({ message: `${product.name} does not have enough stock.` });
    }

    item.quantity = quantity;
    await item.save();
    await item.populate('product_id');
    return res.json({ message: 'Cart item updated.', item: toClientItem(item) });
  } catch (error) {
    console.error('Update cart item error:', error);
    return res.status(500).json({ message: 'Unable to update this cart item.' });
  }
}

async function removeCartItem(req, res) {
  const cartId = parseCartId(req.query.cart_id);
  if (!cartId) return res.status(400).json({ message: 'A valid cart ID is required.' });
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'A valid cart item ID is required.' });
  }

  try {
    const item = await Cart.findOneAndDelete({ _id: req.params.id, cart_id: cartId });
    if (!item) return res.status(404).json({ message: 'Cart item not found.' });
    return res.json({ message: 'Cart item removed.' });
  } catch (error) {
    console.error('Remove cart item error:', error);
    return res.status(500).json({ message: 'Unable to remove this cart item.' });
  }
}

async function clearCart(req, res) {
  const cartId = parseCartId(req.query.cart_id);
  if (!cartId) return res.status(400).json({ message: 'A valid cart ID is required.' });

  try {
    await Cart.deleteMany({ cart_id: cartId });
    return res.json({ message: 'Cart cleared.' });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({ message: 'Unable to clear your cart.' });
  }
}

module.exports = { getCart, addCartItem, updateCartItem, removeCartItem, clearCart };
