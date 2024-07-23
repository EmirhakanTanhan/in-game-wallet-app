import {getFirestore, FieldValue} from 'firebase-admin/firestore';
import {InitialBalanceTransaction, SimplifiedTransaction, Transaction, TransactionInput} from '../types/transaction';
import {simplifiedTransactionConverter, transactionConverter} from '../utils/transactionHelper';
import {calculateCurrentBalance} from "./balanceService";
import {updateUserById} from "./userService";
import {userConverter} from "../utils/userHelper";

const db = getFirestore();
const transactionsRef = db.collection('transactions').withConverter(transactionConverter);
const simplifiedTransactionsRef = db.collection('transactions').withConverter(simplifiedTransactionConverter);
const incompleteTransactionsRef = db.collection('incompleteTransactions');
const userRef = db.collection('users').withConverter(userConverter);

// Create a transaction record in Firestore, calculate most current balance of user and update the quick access walletBalance field
export async function createTransactionRecordAndUpdateBalanceIfNeeded(transactionData: TransactionInput): Promise<Transaction> {
    const {userId, status, type} = transactionData;

    // Create transaction object
    const newTransactionRef = transactionsRef.doc();
    const newTransaction: Transaction = {
        ...transactionData,
        id: newTransactionRef.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    // Save transaction document
    try {
        await newTransactionRef.set(newTransaction);
    } catch (error) {
        // If saving attempt is failed, save a copy of the transaction record with the error for handling later.
        // In this case I'm saving a document into Firestore but we can apply other solutions such as saving an object into redis,
        // and trying to save the transaction record into Firestore in a later date.
        console.error('Error creating transaction document:', error);
        await saveIncompleteTransactionRecord(transactionData, error);
        throw new Error('Failed to create transaction record');
    }

    // If transaction is successful, calculate user's current balance and update user's balance
    if (status === 'success' && type !== 'initial_balance') {
        try {
            const currentBalance = await calculateCurrentBalance(userId);
            await updateUserById(userId, {
                wallet: {
                    balance: currentBalance,
                    updatedAt: FieldValue.serverTimestamp(),
                }
            });
        } catch (error) {
            // Failed to update user's walletBalance field, this field is only for quick access to the user's balance information and isn't critical in any way.
            // Continue without throwing error.
            console.error('Error updating user balance:', error);
        }
    }

    return newTransaction;
}

// Get user's transaction history, contains reduced information.
export async function getSimplifiedTransactionsByUserId(userId: string, limit: number = 15): Promise<SimplifiedTransaction[]> {
    const snapshot = await simplifiedTransactionsRef
        .where('userId', '==', userId)
        .where('type', 'in', ['deposit', 'purchase'])
        .where('status', '==', 'success')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

    return snapshot.docs.map(doc => doc.data());
}

// Get transaction
export async function getTransactionById(id: string): Promise<Transaction | null> {
    const snapshot = await transactionsRef.doc(id).get();
    return snapshot.exists ? snapshot.data()! : null;
}

// Iterate through user's deposit and purchase transactions and save the most current balance on the initial balance transaction.
// Discard the last initial balance.
export async function manuallyCreateInitialBalanceTransaction(userId: string): Promise<InitialBalanceTransaction> {
    return db.runTransaction(async (transaction) => {
        // Get the last initial balance transaction
        const lastInitialBalanceSnapshot = await transaction.get(
            transactionsRef
                .where('userId', '==', userId)
                .where('type', '==', 'initial_balance')
                .where('isLast', '==', true)
                .limit(1)
        );

        if (lastInitialBalanceSnapshot.empty) {
            throw new Error('No initial balance found for user');
        }

        const lastInitialBalance = lastInitialBalanceSnapshot.docs[0].data();

        // Store the balance on the last InitialBalanceTransaction
        let currentBalance = parseFloat(lastInitialBalance.amount.toFixed(2));
        let includedTransactions: string[] = [];

        // Get all transactions after the last initial balance
        const subsequentTransactionsSnapshot = await transaction.get(
            transactionsRef
                .where('userId', '==', userId)
                .where('createdAt', '>', new Date(lastInitialBalance.createdAt as string))
                .where('status', '==', 'success')
                .orderBy('createdAt', 'asc')
        );

        // Iterate through transactions, update the current balance and store id's of the iterated transactions
        subsequentTransactionsSnapshot.forEach((doc) => {
            const transaction = doc.data();

            switch (transaction.type) {
                case 'deposit':
                    currentBalance += transaction.amount;
                    includedTransactions.push(transaction.id);
                    break;
                case 'purchase':
                    currentBalance -= transaction.amount;
                    includedTransactions.push(transaction.id);
                    break;
                default:
                    throw new Error(`Invalid type of transaction: ${transaction.type}`);
            }

            currentBalance = parseFloat(currentBalance.toFixed(2));
        });

        // Set isLast to false for the previous initial balance
        transaction.update(lastInitialBalanceSnapshot.docs[0].ref, {
            isLast: false,
            updatedAt: FieldValue.serverTimestamp(),
        });

        // Create new initialBalanceTransaction
        const newInitialBalanceRef = transactionsRef.doc();
        const newInitialBalance: InitialBalanceTransaction = {
            id: newInitialBalanceRef.id,
            userId,
            type: 'initial_balance',
            status: 'success',
            amount: currentBalance,
            isLast: true,
            includedTransactions: includedTransactions,
            previousInitialBalanceId: lastInitialBalance.id,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        transaction.set(newInitialBalanceRef, newInitialBalance);

        // Update user's walletBalance for quick access
        const userDocRef = userRef.doc(userId);
        transaction.update(userDocRef, {
            wallet: {
                balance: currentBalance,
                updatedAt: FieldValue.serverTimestamp(),
            }
        });

        return newInitialBalance;
    });
}

async function saveIncompleteTransactionRecord(transactionData: TransactionInput, error: any) {
    await incompleteTransactionsRef.add({
        status: 'unresolved',
        transactionData,
        error,
        createdAt: FieldValue.serverTimestamp(),
    });
}