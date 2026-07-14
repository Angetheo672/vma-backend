const Order = require('../models/Order');

const getOrders = async (req, res) => {
  if (req.user.type === 'admin') {
    const orders = await Order.find().populate('user', 'name email').populate('items.product', 'name price');
    return res.json(orders);
  }

  const orders = await Order.find({ user: req.user._id })
    .populate('user', 'name email')
    .populate('items.product', 'name price');
  res.json(orders);
};

const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('items.product', 'name price');

  if (!order) {
    return res.status(404).json({ message: 'Commande introuvable.' });
  }

  if (req.user.type !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  res.json(order);
};

const createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod, itemsPrice, shippingPrice, taxPrice, totalPrice } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Aucun article dans la commande.' });
  }

  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice
  });

  res.status(201).json(order);
};

const updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Commande introuvable.' });
  }

  order.status = req.body.status || order.status;
  if (req.body.isPaid !== undefined) {
    order.isPaid = req.body.isPaid;
    if (req.body.isPaid) {
      order.paidAt = Date.now();
    }
  }
  if (req.body.isDelivered !== undefined) {
    order.isDelivered = req.body.isDelivered;
    if (req.body.isDelivered) {
      order.deliveredAt = Date.now();
    }
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
};

const deleteOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'Commande introuvable.' });
  }

  if (req.user.type !== 'admin' && order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }

  await order.remove();
  res.json({ message: 'Commande supprimée avec succès.' });
};

module.exports = { getOrders, getOrderById, createOrder, updateOrderStatus, deleteOrder };
