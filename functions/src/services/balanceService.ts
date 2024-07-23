import {getFirestore} from "firebase-admin/firestore";
import {userConverter} from "../utils/userHelper";
import {transactionConverter} from "../utils/transactionHelper";

const db = getFirestore();
const transactionsRef = db.collection('transactions').withConverter(transactionConverter);
const usersRef = db.collection('users').withConverter(userConverter);

// Calculate user's current balance by Iterating through user's deposit and purchase transactions,
// starting from the last InitialBalanceTransaction
export async function calculateCurrentBalance(userId: string): Promise<number> {
    // Get the last initial balance transaction
    const lastInitialBalanceSnapshot = await transactionsRef
        .where('userId', '==', userId)
        .where('type', '==', 'initial_balance')
        .where('isLast', '==', true)
        .limit(1)
        .get();

    if (lastInitialBalanceSnapshot.empty) {
        // User is a new sign-up, continue with 0 balance
        return 0;
    }

    const lastInitialBalance = lastInitialBalanceSnapshot.docs[0].data();
    let currentBalance = parseFloat(lastInitialBalance.amount.toFixed(2));

    // Get all transactions after the last initial balance
    const subsequentTransactionsSnapshot = await transactionsRef
        .where('userId', '==', userId)
        .where('createdAt', '>', new Date(lastInitialBalance.createdAt as string))
        .where('status', '==', 'success')
        .orderBy('createdAt', 'asc')
        .get();

    // Iterate through transactions, update the balance
    subsequentTransactionsSnapshot.forEach((doc) => {
        const transaction = doc.data();
        switch (transaction.type) {
            case 'deposit':
                currentBalance += transaction.amount;
                break;
            case 'purchase':
                currentBalance -= transaction.amount;
                break;
            default:
                throw new Error(`Invalid type of transaction: ${transaction.type}`);
        }

        currentBalance = parseFloat(currentBalance.toFixed(2));
    });

    return currentBalance;
}

// Get user's wallet balance. This function doesn't calculate current balance,
// it only fetches the walletBalance field for quick access
export async function getUserBalance(userId: string): Promise<number> {
    const userDoc = await usersRef.doc(userId).get();

    if (!userDoc.exists) {
        throw new Error('User not found');
    }

    const userData = userDoc.data()!;
    return userData.wallet.balance;
}