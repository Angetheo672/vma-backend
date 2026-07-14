require('dotenv').config();
const mongoose = require('mongoose');

console.log('Tentative de connexion à MongoDB...');
console.log('URI:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connexion MongoDB réussie !');
    process.exit(0);
})
.catch(err => {
    console.error('❌ Erreur de connexion MongoDB :', err.message);
    process.exit(1);
});
