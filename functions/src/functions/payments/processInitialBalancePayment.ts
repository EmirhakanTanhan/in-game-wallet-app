import { onCall, HttpsError } from "firebase-functions/v2/https";
import { manuallyCreateInitialBalanceTransaction } from '../../services/transactionService';

// Iterate through user's deposit and purchase transactions and save the most current balance on the initial balance transaction.
// Discard the last initial balance.
export const processInitialBalancePayment = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required");
    }

    const userId = request.auth.uid;

    try {
        await manuallyCreateInitialBalanceTransaction(userId);

        return {
            success: true,
            message: 'Initial balance transaction created successfully'
        };
    } catch (error) {
        console.error('Error creating initial balance transaction:', error);
        throw new HttpsError('internal', 'Error creating initial balance transaction');
    }
});