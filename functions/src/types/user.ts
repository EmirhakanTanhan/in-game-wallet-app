import {FieldValue} from "firebase-admin/firestore";

export interface User {
    id: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    initialBalanceDay: number;
    createdAt: FieldValue | string;
    lastLoginAt: FieldValue | string;
    wallet: {
        balance: number;
        updatedAt: FieldValue | string;
    };
}

export type UserInput = Omit<User, 'id' | 'initialBalanceDay' | 'createdAt'>;