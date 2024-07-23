import {User, UserInput} from '../types/user';
import {FirestoreDataConverter, QueryDocumentSnapshot} from "firebase-admin/firestore";
import {auth} from "firebase-admin";
import {FieldValue} from "firebase-admin/firestore";

export const userConverter: FirestoreDataConverter<User> = {
    toFirestore(user: User): FirebaseFirestore.DocumentData {
        const {id, ...data} = user;

        return {
            ...data,
        };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): User {
        const data = snapshot.data();

        return {
            id: snapshot.id,
            email: data.email,
            displayName: data.displayName,
            photoURL: data.photoURL,
            initialBalanceDay: data.initialBalanceDay,
            createdAt: data.createdAt.toDate().toISOString(),
            lastLoginAt: data.lastLoginAt.toDate().toISOString(),
            wallet: {
                balance: data.wallet.balance,
                updatedAt: data.wallet.updatedAt.toDate().toISOString(),
            },
        };
    },
};

export function createUserInput(userRecord: auth.UserRecord): UserInput {
    return {
        email: userRecord.email ?? '',
        displayName: userRecord.displayName ?? null,
        photoURL: userRecord.photoURL ?? null,
        lastLoginAt: FieldValue.serverTimestamp(),
        wallet: {
            balance: 0,
            updatedAt: FieldValue.serverTimestamp(),
        },
    };
}