require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Data directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Data files
const usersFile = path.join(dataDir, 'users.json');
const productsFile = path.join(dataDir, 'products.json');
const ordersFile = path.join(dataDir, 'orders.json');
const vendorsFile = path.join(dataDir, 'vendors.json');

// Initialize data files
const initDataFiles = () => {
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
  if (!fs.existsSync(productsFile)) fs.writeFileSync(productsFile, JSON.stringify([], null, 2));
  if (!fs.existsSync(ordersFile)) fs.writeFileSync(ordersFile, JSON.stringify([], null, 2));
  if (!fs.existsSync(vendorsFile)) fs.writeFileSync(vendorsFile, JSON.stringify([], null, 2));
};

initDataFiles();

// Helper functions to read/write JSON
const readData = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
};

const writeData = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Auth Middleware
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const users = readData(usersFile);
    const user = users.find(u => u._id === decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.type === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Accès administrateur requis' });
  }
};

// =====================
// AUTHENTICATION ROUTES
// =====================

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, type, company, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Tous les champs requis' });
  }

  const users = readData(usersFile);
  if (users.find(u => u.email === email.toLowerCase())) {
    return res.status(409).json({ message: 'Email déjà utilisé' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = {
    _id: generateId(),
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    type: type || 'client',
    company,
    phone,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  writeData(usersFile, users);

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    type: user.type,
    company: user.company,
    phone: user.phone,
    token
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  const users = readData(usersFile);
  const user = users.find(u => u.email === email.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    type: user.type,
    token
  });
});

app.get('/api/auth/profile', protect, (req, res) => {
  res.json(req.user);
});

// =====================
// PRODUCTS ROUTES
// =====================

app.get('/api/products', (req, res) => {
  const products = readData(productsFile);
  const { category, minPrice, maxPrice, search } = req.query;

  let filtered = products;

  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }
  if (minPrice) {
    filtered = filtered.filter(p => p.price >= Number(minPrice));
  }
  if (maxPrice) {
    filtered = filtered.filter(p => p.price <= Number(maxPrice));
  }
  if (search) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  res.json(filtered);
});

app.get('/api/products/:id', (req, res) => {
  const products = readData(productsFile);
  const product = products.find(p => p._id === req.params.id);

  if (!product) {
    return res.status(404).json({ message: 'Produit introuvable' });
  }

  res.json(product);
});

app.post('/api/products', protect, admin, (req, res) => {
  const { name, category, price, quantity, description, imageUrl } = req.body;

  if (!name || !category || !price || quantity === undefined) {
    return res.status(400).json({ message: 'Champs requis' });
  }

  const products = readData(productsFile);
  const product = {
    _id: generateId(),
    name,
    category,
    price: Number(price),
    quantity: Number(quantity),
    description,
    imageUrl,
    rating: 4.5,
    reviews: 0,
    createdAt: new Date().toISOString()
  };

  products.push(product);
  writeData(productsFile, products);

  res.status(201).json(product);
});

app.put('/api/products/:id', protect, admin, (req, res) => {
  const products = readData(productsFile);
  const index = products.findIndex(p => p._id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'Produit introuvable' });
  }

  const { name, category, price, quantity, description, imageUrl } = req.body;
  products[index] = {
    ...products[index],
    name: name || products[index].name,
    category: category || products[index].category,
    price: price !== undefined ? Number(price) : products[index].price,
    quantity: quantity !== undefined ? Number(quantity) : products[index].quantity,
    description: description || products[index].description,
    imageUrl: imageUrl || products[index].imageUrl
  };

  writeData(productsFile, products);
  res.json(products[index]);
});

app.delete('/api/products/:id', protect, admin, (req, res) => {
  const products = readData(productsFile);
  const filtered = products.filter(p => p._id !== req.params.id);

  if (filtered.length === products.length) {
    return res.status(404).json({ message: 'Produit introuvable' });
  }

  writeData(productsFile, filtered);
  res.json({ message: 'Produit supprimé' });
});

// =====================
// ORDERS ROUTES
// =====================

app.get('/api/orders', protect, (req, res) => {
  const orders = readData(ordersFile);

  if (req.user.type !== 'admin') {
    return res.json(orders.filter(o => o.user === req.user._id));
  }

  res.json(orders);
});

app.get('/api/orders/:id', protect, (req, res) => {
  const orders = readData(ordersFile);
  const order = orders.find(o => o._id === req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Commande introuvable' });
  }

  if (req.user.type !== 'admin' && order.user !== req.user._id) {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  res.json(order);
});

app.post('/api/orders', protect, (req, res) => {
  const { items, shippingAddress, paymentMethod, itemsPrice, shippingPrice, taxPrice, totalPrice } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Aucun article' });
  }

  const orders = readData(ordersFile);
  const order = {
    _id: generateId(),
    user: req.user._id,
    items,
    shippingAddress,
    paymentMethod,
    itemsPrice: Number(itemsPrice),
    shippingPrice: Number(shippingPrice),
    taxPrice: Number(taxPrice),
    totalPrice: Number(totalPrice),
    status: 'pending',
    isPaid: false,
    isDelivered: false,
    createdAt: new Date().toISOString()
  };

  orders.push(order);
  writeData(ordersFile, orders);

  res.status(201).json(order);
});

app.put('/api/orders/:id/status', protect, admin, (req, res) => {
  const orders = readData(ordersFile);
  const index = orders.findIndex(o => o._id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'Commande introuvable' });
  }

  const { status, isPaid, isDelivered } = req.body;
  orders[index] = {
    ...orders[index],
    status: status || orders[index].status,
    isPaid: isPaid !== undefined ? isPaid : orders[index].isPaid,
    paidAt: isPaid ? new Date().toISOString() : orders[index].paidAt,
    isDelivered: isDelivered !== undefined ? isDelivered : orders[index].isDelivered,
    deliveredAt: isDelivered ? new Date().toISOString() : orders[index].deliveredAt
  };

  writeData(ordersFile, orders);
  res.json(orders[index]);
});

app.delete('/api/orders/:id', protect, admin, (req, res) => {
  const orders = readData(ordersFile);
  const filtered = orders.filter(o => o._id !== req.params.id);

  if (filtered.length === orders.length) {
    return res.status(404).json({ message: 'Commande introuvable' });
  }

  writeData(ordersFile, filtered);
  res.json({ message: 'Commande supprimée' });
});

// =====================
// VENDORS ROUTES
// =====================

app.get('/api/vendors', (req, res) => {
  const vendors = readData(vendorsFile);
  const { country, search } = req.query;

  let filtered = vendors;

  if (country) {
    filtered = filtered.filter(v => v.country === country);
  }
  if (search) {
    filtered = filtered.filter(v =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.company.toLowerCase().includes(search.toLowerCase())
    );
  }

  res.json(filtered);
});

app.get('/api/vendors/:id', (req, res) => {
  const vendors = readData(vendorsFile);
  const vendor = vendors.find(v => v._id === req.params.id);

  if (!vendor) {
    return res.status(404).json({ message: 'Fournisseur introuvable' });
  }

  res.json(vendor);
});

app.post('/api/vendors', protect, admin, (req, res) => {
  const { name, company, country, contactEmail, contactPhone } = req.body;

  if (!name || !company || !country || !contactEmail) {
    return res.status(400).json({ message: 'Champs requis' });
  }

  const vendors = readData(vendorsFile);
  const vendor = {
    _id: generateId(),
    name,
    company,
    country,
    contactEmail,
    contactPhone,
    rating: 4.5,
    createdAt: new Date().toISOString()
  };

  vendors.push(vendor);
  writeData(vendorsFile, vendors);

  res.status(201).json(vendor);
});

app.put('/api/vendors/:id', protect, admin, (req, res) => {
  const vendors = readData(vendorsFile);
  const index = vendors.findIndex(v => v._id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'Fournisseur introuvable' });
  }

  const { name, company, country, contactEmail, contactPhone, rating } = req.body;
  vendors[index] = {
    ...vendors[index],
    name: name || vendors[index].name,
    company: company || vendors[index].company,
    country: country || vendors[index].country,
    contactEmail: contactEmail || vendors[index].contactEmail,
    contactPhone: contactPhone || vendors[index].contactPhone,
    rating: rating !== undefined ? Number(rating) : vendors[index].rating
  };

  writeData(vendorsFile, vendors);
  res.json(vendors[index]);
});

app.delete('/api/vendors/:id', protect, admin, (req, res) => {
  const vendors = readData(vendorsFile);
  const filtered = vendors.filter(v => v._id !== req.params.id);

  if (filtered.length === vendors.length) {
    return res.status(404).json({ message: 'Fournisseur introuvable' });
  }

  writeData(vendorsFile, filtered);
  res.json({ message: 'Fournisseur supprimé' });
});

// =====================
// LOGISTICS ROUTES
// =====================

app.get('/api/logistics', protect, (req, res) => {
  const orders = readData(ordersFile);
  // Return basic logistics info from orders
  res.json(orders.map(o => ({
    _id: o._id,
    order: o._id,
    status: o.status,
    createdAt: o.createdAt
  })));
});

app.get('/api/logistics/:id', protect, (req, res) => {
  const orders = readData(ordersFile);
  const order = orders.find(o => o._id === req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Suivi introuvable' });
  }

  res.json({
    _id: order._id,
    order: order._id,
    status: order.status,
    createdAt: order.createdAt
  });
});

// =====================
// PAYMENTS ROUTES
// =====================

app.get('/api/payments', protect, admin, (req, res) => {
  const orders = readData(ordersFile);
  // Return payment info from orders
  res.json(orders.map(o => ({
    _id: o._id,
    order: o._id,
    amount: o.totalPrice,
    status: o.isPaid ? 'completed' : 'pending',
    createdAt: o.createdAt
  })));
});

app.get('/api/payments/:id', protect, (req, res) => {
  const orders = readData(ordersFile);
  const order = orders.find(o => o._id === req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Paiement introuvable' });
  }

  res.json({
    _id: order._id,
    order: order._id,
    amount: order.totalPrice,
    status: order.isPaid ? 'completed' : 'pending',
    createdAt: order.createdAt
  });
});

app.post('/api/payments', protect, (req, res) => {
  const { order, amount, method } = req.body;

  if (!order || !amount || !method) {
    return res.status(400).json({ message: 'Champs requis' });
  }

  res.status(201).json({
    _id: generateId(),
    order,
    amount: Number(amount),
    method,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Erreur serveur' });
});

app.listen(PORT, () => {
  console.log(`\n✅ Vision Market Africa Mock Backend running on port ${PORT}`);
  console.log(`📁 Data stored in: ${dataDir}`);
  console.log(`🌍 Frontend: http://localhost:3000\n`);
});
