const Vendor = require('../models/Vendor');

const getVendors = async (req, res) => {
  const filters = {};
  const { category, country, service, search } = req.query;

  if (category) filters.categories = category;
  if (country) filters.country = country;
  if (service) filters.services = service;
  if (search) filters.$or = [
    { name: { $regex: search, $options: 'i' } },
    { company: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } }
  ];

  const vendors = await Vendor.find(filters);
  res.json(vendors);
};

const getVendorById = async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    return res.status(404).json({ message: 'Fournisseur introuvable.' });
  }
  res.json(vendor);
};

const createVendor = async (req, res) => {
  const { name, company, country, products, services, rating, contactEmail, contactPhone } = req.body;

  if (!name || !company || !country || !contactEmail) {
    return res.status(400).json({ message: 'Tous les champs requis doivent être remplis.' });
  }

  const vendor = await Vendor.create({
    name,
    company,
    country,
    products,
    services,
    rating,
    contactEmail,
    contactPhone
  });

  res.status(201).json(vendor);
};

const updateVendor = async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    return res.status(404).json({ message: 'Fournisseur introuvable.' });
  }

  const { name, company, country, products, services, rating, contactEmail, contactPhone } = req.body;

  vendor.name = name || vendor.name;
  vendor.company = company || vendor.company;
  vendor.country = country || vendor.country;
  vendor.products = products || vendor.products;
  vendor.services = services || vendor.services;
  vendor.rating = rating !== undefined ? rating : vendor.rating;
  vendor.contactEmail = contactEmail || vendor.contactEmail;
  vendor.contactPhone = contactPhone || vendor.contactPhone;

  const updatedVendor = await vendor.save();
  res.json(updatedVendor);
};

const deleteVendor = async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    return res.status(404).json({ message: 'Fournisseur introuvable.' });
  }

  await vendor.remove();
  res.json({ message: 'Fournisseur supprimé avec succès.' });
};

module.exports = { getVendors, getVendorById, createVendor, updateVendor, deleteVendor };
