import {FirestoreDataConverter, QueryDocumentSnapshot} from "firebase-admin/lib/firestore";
import {Product} from "../types/product";

export const productConverter: FirestoreDataConverter<Product> = {
    toFirestore(): FirebaseFirestore.DocumentData {
        return {};
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): Product {
        const data = snapshot.data();

        return {
            id: snapshot.id,
            name: data.name,
            price: data.price,
        };
    },
};