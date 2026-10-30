const Order = require('../models/Order');
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

module.exports = { listOrders, createOrder };
