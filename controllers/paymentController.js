const Payment = require('../models/Payment');

const getPayments = async (req, res) => {
  const payments = await Payment.find().populate('order', 'orderNumber status totalPrice');
  res.json(payments);
};

const getPaymentById = async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate('order', 'orderNumber status totalPrice');
  if (!payment) {
    return res.status(404).json({ message: 'Paiement introuvable.' });
  }
  res.json(payment);
};

const createPayment = async (req, res) => {
  const { order, amount, method, status, transactionId, paidAt } = req.body;

  if (!order || !amount || !method) {
    return res.status(400).json({ message: 'order, amount et method sont requis.' });
  }

  const payment = await Payment.create({
    order,
    amount,
    method,
    status: status || 'pending',
    transactionId,
    paidAt
  });

  res.status(201).json(payment);
};

const updatePaymentStatus = async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    return res.status(404).json({ message: 'Paiement introuvable.' });
  }

  payment.status = req.body.status || payment.status;
  if (req.body.paidAt) {
    payment.paidAt = req.body.paidAt;
  }

  const updatedPayment = await payment.save();
  res.json(updatedPayment);
};

module.exports = { getPayments, getPaymentById, createPayment, updatePaymentStatus };
