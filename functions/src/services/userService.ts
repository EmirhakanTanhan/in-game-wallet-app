import {getFirestore, FieldValue, Timestamp} from 'firebase-admin/firestore';
import {User, UserInput} from '../types/user';
import {userConverter} from '../utils/userHelper';

const db = getFirestore();
const usersRef = db.collection('users').withConverter(userConverter);

// Create user in Firestore
export async function createUser(userId: string, userData: UserInput): Promise<User> {
    const newUser: User = {
        ...userData,
        id: userId,
        initialBalanceDay: Timestamp.now().toDate().getDate(),
        createdAt: FieldValue.serverTimestamp(),
    };

    await usersRef.doc(userId).set(newUser);

    return newUser;
}

// Get user
export async function getUserById(userId: string): Promise<User | null> {
    const snapshot = await usersRef.doc(userId).get();
    return snapshot.exists ? snapshot.data()! : null;
}

// Update user
export async function updateUserById(userId: string, updates: Partial<User>): Promise<void> {
    await usersRef.doc(userId).update(updates);
}