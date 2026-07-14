const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d'
  });
};

const registerUser = async (req, res) => {
  const { name, email, password, type, company, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Tous les champs requis doivent être remplis.' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    type: type || 'client',
    company,
    phone
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    type: user.type,
    company: user.company,
    phone: user.phone,
    token: generateToken(user._id)
  });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (user && bcrypt.compareSync(password, user.password)) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      type: user.type,
      token: generateToken(user._id)
    });
  } else {
    res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
  }
};

const getProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Utilisateur non authentifié.' });
  }

  res.json(req.user);
};

module.exports = { registerUser, loginUser, getProfile };
