require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Product = require('./models/Product');
const User = require('./models/User');

// Configuration Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const productsToImport = [
    {
        name: "Chaussures Sport Elite Air",
        description: "Baskets ultra-légères pour le sport et le quotidien.",
        price: 35000,
        category: "Mode",
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
        stock: 50
    },
    {
        name: "Smart TV 55' 4K Crystal",
        description: "Écran LED haute résolution, HDR10+, Smart Hub intégré.",
        price: 350000,
        category: "Électronique",
        imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800",
        stock: 12
    },
    {
        name: "Cafetière Espresso Pro",
        description: "Préparez des cafés dignes d'un barista à la maison.",
        price: 85000,
        category: "Maison",
        imageUrl: "https://images.unsplash.com/photo-1510972527921-ce03766a1cf1?w=800",
        stock: 20
    },
    {
        name: "Casque Bluetooth VMA-Audio",
        description: "Réduction de bruit active, 40h d'autonomie.",
        price: 45000,
        category: "Électronique",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
        stock: 30
    },
    {
        name: "Sac de Voyage Cuir Premium",
        description: "Idéal pour vos déplacements business.",
        price: 125000,
        category: "Mode",
        imageUrl: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800",
        stock: 15
    },
    {
        name: "Drone Mavic Air Clone VMA",
        description: "Caméra stabilisée 4K, pliable et performant.",
        price: 275000,
        category: "Électronique",
        imageUrl: "https://images.unsplash.com/photo-1473968512647-3e44a224fe8f?w=800",
        stock: 5
    }
];

const runImport = async () => {
    try {
        console.log("Démarrage de l'importation massive vers Cloudinary + MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);

        let supplier = await User.findOne({ email: 'admin@vma.com' });
        if (!supplier) {
            console.log("Erreur: Utilisateur admin@vma.com introuvable. Lancez d'abord seed.js");
            process.exit(1);
        }

        for (const item of productsToImport) {
            console.log(`Traitement de: ${item.name}...`);

            // 1. Uploader vers Cloudinary
            const uploadRes = await cloudinary.uploader.upload(item.imageUrl, {
                folder: 'vma_products_seed'
            });

            // 2. Créer le produit dans MongoDB
            const product = new Product({
                ...item,
                supplier: supplier._id,
                images: [uploadRes.secure_url],
                isVerified: true,
                rating: 4.5 + Math.random() * 0.5
            });

            await product.save();
            console.log(`✅ ${item.name} ajouté avec succès (Cloudinary URL: ${uploadRes.secure_url})`);
        }

        console.log("\n--- IMPORTATION TERMINÉE AVEC SUCCÈS ---");
        process.exit();

    } catch (err) {
        console.error("Erreur lors de l'importation:", err.message);
        process.exit(1);
    }
};

runImport();
