import {getFirestore} from 'firebase-admin/firestore';
import {productConverter} from '../utils/productHelper';
import {Product} from "../types/product";

const db = getFirestore();
const productsRef = db.collection('products').withConverter(productConverter);

// Get product
export async function getProductById(productId: string): Promise<Product | null> {
    const snapshot = await productsRef.doc(productId).get();
    return snapshot.exists ? snapshot.data()! : null;
}

// Get all products
export async function getAllProduct(): Promise<Product[]> {
    const snapshot = await productsRef.get();
    return snapshot.docs.map(doc => doc.data());
}