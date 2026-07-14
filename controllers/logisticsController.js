const Logistic = require('../models/Logistic');

const getLogistics = async (req, res) => {
  if (req.user.type === 'admin') {
    const logistics = await Logistic.find().populate('order', 'orderNumber status totalPrice');
    return res.json(logistics);
  }

  const logistics = await Logistic.find({ createdBy: req.user._id }).populate('order', 'orderNumber status totalPrice');
  res.json(logistics);
};

const getLogisticById = async (req, res) => {
  const logistic = await Logistic.findById(req.params.id).populate('order', 'orderNumber status totalPrice');
  if (!logistic) {
    return res.status(404).json({ message: 'Suivi logistique introuvable.' });
  }
  if (req.user.type !== 'admin' && logistic.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }
  res.json(logistic);
};

const createLogistic = async (req, res) => {
  const { order, carrier, trackingNumber, estimatedDelivery, status } = req.body;

  if (!order || !carrier || !trackingNumber) {
    return res.status(400).json({ message: 'Order, carrier et trackingNumber sont requis.' });
  }

  const logistic = await Logistic.create({
    order,
    carrier,
    trackingNumber,
    estimatedDelivery,
    status,
    createdBy: req.user._id
  });

  res.status(201).json(logistic);
};

const updateLogisticStatus = async (req, res) => {
  const logistic = await Logistic.findById(req.params.id);
  if (!logistic) {
    return res.status(404).json({ message: 'Suivi logistique introuvable.' });
  }

  logistic.status = req.body.status || logistic.status;
  logistic.estimatedDelivery = req.body.estimatedDelivery || logistic.estimatedDelivery;
  logistic.deliveryNotes = req.body.deliveryNotes || logistic.deliveryNotes;

  const updatedLogistic = await logistic.save();
  res.json(updatedLogistic);
};

module.exports = { getLogistics, getLogisticById, createLogistic, updateLogisticStatus };
