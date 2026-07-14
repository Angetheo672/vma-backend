const Product = require('../models/Product');

const getProducts = async (req, res) => {
  const filters = {};
  const { category, minPrice, maxPrice, search, vendor } = req.query;

  if (category) filters.category = category;
  if (vendor) filters.vendor = vendor;
  if (minPrice) filters.price = { ...filters.price, $gte: Number(minPrice) };
  if (maxPrice) filters.price = { ...filters.price, $lte: Number(maxPrice) };
  if (search) filters.name = { $regex: search, $options: 'i' };

  const products = await Product.find(filters).populate('vendor', 'name company location');
  res.json(products);
};

const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id).populate('vendor', 'name company location');
  if (!product) {
    return res.status(404).json({ message: 'Produit introuvable.' });
  }
  res.json(product);
};

const createProduct = async (req, res) => {
  const { name, description, category, price, quantity, imageUrl, vendor } = req.body;

  if (!name || !description || !price || !quantity || !vendor) {
    return res.status(400).json({ message: 'Tous les champs requis doivent être remplis.' });
  }

  const product = await Product.create({
    name,
    description,
    category,
    price,
    quantity,
    imageUrl,
    vendor
  });

  res.status(201).json(product);
};

const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Produit introuvable.' });
  }

  const { name, description, category, price, quantity, imageUrl, vendor, isActive } = req.body;

  product.name = name || product.name;
  product.description = description || product.description;
  product.category = category || product.category;
  product.price = price !== undefined ? price : product.price;
  product.quantity = quantity !== undefined ? quantity : product.quantity;
  product.imageUrl = imageUrl || product.imageUrl;
  product.vendor = vendor || product.vendor;
  product.isActive = isActive !== undefined ? isActive : product.isActive;

  const updatedProduct = await product.save();
  res.json(updatedProduct);
};

const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Produit introuvable.' });
  }

  await product.remove();
  res.json({ message: 'Produit supprimé avec succès.' });
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
