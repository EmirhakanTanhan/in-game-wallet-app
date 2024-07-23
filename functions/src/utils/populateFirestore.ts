const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./../../../config/in-game-wallet-app-firebase-adminsdk-sg82e-617770915a.json');
const fs = require('fs');
const path = require('path');

const firebaseConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../..', 'firebase.json'), 'utf8'));
const firestorePort = firebaseConfig.emulators.firestore.port;

const firestoreSettings = {
    host: `localhost:${firestorePort}`,
    ssl: false
};

initializeApp({
    projectId: 'in-game-wallet-app',
    credential: cert(serviceAccount)
});

const db = getFirestore();
// db.settings(firestoreSettings);

const products = [
    {id: 'gold_100', name: 'Gold Package 100', price: 0.99},
    {id: 'gold_500', name: 'Gold Package 500', price: 3.99},
    {id: 'skin_corvo', name: 'Corvo Attano', price: 2.99},
    {id: 'skin_emily', name: 'Emily kaldwin', price: 2.99},
];

async function populateProducts() {
    const productsRef = db.collection('products');

    for (const product of products) {
        await productsRef.doc(product.id).set(product);
        console.log(`Added product: ${product.name}`);
    }

    console.log('Finished populating products');
}

populateProducts().then(() => process.exit());