import { onCall, HttpsError } from "firebase-functions/v2/https";
import { manuallyCreateInitialBalanceTransaction } from '../../services/transactionService';
import {logError, logInfo} from "../../utils/errorHandler";

// Iterate through user's deposit and purchase transactions and save the most current balance on the initial balance transaction.
// Discard the last initial balance.
export const processInitialBalancePayment = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const userId = request.auth.uid;

    try {
        const transactionRecord = await manuallyCreateInitialBalanceTransaction(userId);

        logInfo('Initial balance transaction is successful', {userId, transactionId: transactionRecord.id});
        return {
            status: 'successful',
            message: 'Initial balance transaction created successfully'
        };
    } catch (error) {
        logError('Unable to process initial balance transaction', {userId, error});
        throw new HttpsError('internal', 'Error processing payment');
    }
});