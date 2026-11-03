const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { asArray } = require('../utils/formatters');

async function listOrders(req, res) {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return res.status(200).json(asArray(orders).map((order) => order.toClient()));
  } catch (error) {
    console.error('Orders GET error:', error);
    return res.status(500).json({ message: 'Error fetching orders', error: error.message, data: [] });
  }
}

async function createOrder(req, res) {
  try {
    const { customer_name, total_amount, status } = req.body || {};
    if (!customer_name || total_amount === undefined) {
      return res.status(400).json({ message: 'Customer name and total amount are required.' });
    }
    if (!Number.isFinite(Number(total_amount)) || Number(total_amount) < 0) {
      return res.status(400).json({ message: 'Total amount must be a non-negative number.' });
    }

    const count = await Order.countDocuments();
    const order = await Order.create({
      order_id: `#ORD-${String(count + 1).padStart(3, '0')}`,
      customer_name: String(customer_name).trim(),
      total_amount: Number(total_amount),
      status: ['Pending', 'Shipped', 'Cancelled'].includes(status) ? status : 'Pending',
      user: req.user && req.user.id,
    });

    return res.status(201).json({ message: 'Order created.', order: order.toClient() });
  } catch (error) {
    console.error('Orders POST error:', error);
    return res.status(500).json({ message: 'Error creating order', error: error.message });
  }
}

async function releaseStockReservations(reservations) {
  const remaining = [];
  for (const reservation of reservations) {
    try {
      const result = await Product.updateOne(
        { _id: reservation.productId },
        { $inc: { stock: reservation.quantity } }
      );
      if (result.modifiedCount !== 1) {
        throw new Error('Reserved product no longer exists.');
      }
    } catch (error) {
      console.error('Stock reservation rollback error:', error);
      remaining.push(reservation);
    }
  }
  return remaining;
}

async function checkout(req, res) {
  let reservations = [];
  try {
    const customerName = String(req.body?.customer_name || '').trim();
    const requestedItems = req.body?.items;
    if (!customerName) {
      return res.status(400).json({ message: 'Your name is required.' });
    }
    if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    const productIds = requestedItems.map((item) => item?.product_id);
    if (productIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: 'The cart contains an invalid product.' });
    }
    for (const item of requestedItems) {
      if (
        !Number.isInteger(item?.quantity) ||
        item.quantity < 1 ||
        typeof item?.size !== 'string' ||
        !item.size.trim()
      ) {
        return res.status(400).json({ message: 'Each cart item needs a valid quantity and size.' });
      }
    }

    const products = await Product.find({ _id: { $in: productIds } });
    const productsById = new Map(products.map((product) => [String(product._id).toLowerCase(), product]));
    const requiredByProduct = new Map();
    const orderItems = [];

    for (const item of requestedItems) {
      const product = productsById.get(String(item.product_id).toLowerCase());
      if (!product) {
        return res.status(400).json({ message: 'A product in your cart is no longer available.' });
      }
      if (!product.sizes.includes(item.size)) {
        return res.status(400).json({ message: `${product.name} is not available in size ${item.size}.` });
      }

      const productId = String(product._id).toLowerCase();
      requiredByProduct.set(productId, (requiredByProduct.get(productId) || 0) + item.quantity);
      orderItems.push({
        product_id: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        size: item.size,
        image: product.image || product.image_url || '',
      });
    }

    for (const [productId, quantity] of requiredByProduct) {
      const product = productsById.get(productId);
      if (product.stock < quantity) {
        return res.status(409).json({ message: `${product.name} does not have enough stock.` });
      }
    }

    for (const [productId, quantity] of requiredByProduct) {
      const reservation = await Product.updateOne(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } }
      );
      if (reservation.modifiedCount !== 1) {
        reservations = await releaseStockReservations(reservations);
        if (reservations.length) {
          return res.status(500).json({ message: 'Unable to release reserved stock. Please contact support.' });
        }
        return res.status(409).json({ message: 'A product in your cart no longer has enough stock.' });
      }
      reservations.push({ productId, quantity });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = Number((subtotal * 0.2).toFixed(2));
    const deliveryFee = subtotal > 0 ? 15 : 0;
    const totalAmount = Number((subtotal - discountAmount + deliveryFee).toFixed(2));
    const count = await Order.countDocuments();
    const order = await Order.create({
      order_id: `#ORD-${String(count + 1).padStart(3, '0')}`,
      customer_name: customerName,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      delivery_fee: deliveryFee,
      items: orderItems,
    });

    reservations = [];
    return res.status(201).json({ message: 'Order created.', order: order.toClient() });
  } catch (error) {
    console.error('Storefront checkout error:', error);
    reservations = await releaseStockReservations(reservations);
    if (reservations.length) {
      return res.status(500).json({ message: 'Unable to release reserved stock. Please contact support.' });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Unable to assign a unique order ID. Please retry.' });
    }
    return res.status(500).json({ message: 'Error placing your order.' });
  }
}

async function deleteOrder(req, res) {
  try {
    const requestedId = req.params.id;
    let order = null;

    if (mongoose.Types.ObjectId.isValid(requestedId)) {
      order = await Order.findByIdAndDelete(requestedId);
    }

    if (!order) {
      order = await Order.findOneAndDelete({ order_id: requestedId });
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found for the supplied database or order ID.' });
    }

    return res.status(200).json({ message: 'Order deleted.' });
  } catch (error) {
    console.error('Orders DELETE error:', error);
    return res.status(500).json({ message: 'Error deleting order.' });
  }
}

module.exports = { listOrders, createOrder, checkout, deleteOrder };
