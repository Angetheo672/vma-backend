require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB for seeding...');

        // 1. Create a Default Supplier if none exists
        let supplier = await User.findOne({ email: 'admin@vma.com' });
        if (!supplier) {
            supplier = new User({
                firstName: "VMA",
                lastName: "Official",
                email: "admin@vma.com",
                password: "password123",
                phone: "+237600000000",
                role: "supplier",
                companyName: "Vision Market Africa Ltd",
                isVerified: true
            });
            await supplier.save();
            console.log('✅ Default Supplier created.');
        }

        // 2. Prepare Products
        const seedProducts = [
            {
                supplier: supplier._id,
                name: "iPhone 15 Pro Max Titanium",
                description: "Le dernier iPhone avec finition titane, puce A17 Pro. Importation directe Chine.",
                price: 785000,
                category: "Électronique",
                images: ["https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&w=800"],
                stock: 10,
                isVerified: true,
                rating: 4.9
            },
            {
                supplier: supplier._id,
                name: "Pack 12 Montres Quartz Luxe",
                description: "Lot de 12 montres pour revendeurs. Qualité premium, boîtier acier.",
                price: 45000,
                category: "Gros",
                images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800"],
                stock: 50,
                isVerified: true,
                rating: 4.7
            },
            {
                supplier: supplier._id,
                name: "Sac à Main Designer 'VMA Edition'",
                description: "Élégance et qualité. Cuir véritable, finitions dorées.",
                price: 32000,
                category: "Mode",
                images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800"],
                stock: 25,
                isVerified: true,
                rating: 4.8
            },
            {
                supplier: supplier._id,
                name: "Projecteur Home Cinéma 4K",
                description: "Transformez votre salon en salle de cinéma. Android intégré, WiFi 6.",
                price: 125000,
                category: "Électronique",
                images: ["https://images.unsplash.com/photo-1535016120720-40c646bebbdc?auto=format&fit=crop&w=800"],
                stock: 15,
                isVerified: true,
                rating: 4.6
            },
            {
                supplier: supplier._id,
                name: "Drone Professionnel VMA-X1",
                description: "Caméra 4K stabilisée, 30 min d'autonomie, portée 5km.",
                price: 245000,
                category: "Électronique",
                images: ["https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?auto=format&fit=crop&w=800"],
                stock: 8,
                isVerified: true,
                rating: 5.0
            }
        ];

        // 3. Seed Products if empty
        const count = await Product.countDocuments();
        if (count === 0) {
            await Product.insertMany(seedProducts);
            console.log('✅ Base de données initialisée avec des produits Master Class !');
        } else {
            console.log('La base de données contient déjà des produits.');
        }

        process.exit();
    } catch (err) {
        console.error('❌ Error during seeding:', err.message);
        process.exit(1);
    }
};

seedDB();
