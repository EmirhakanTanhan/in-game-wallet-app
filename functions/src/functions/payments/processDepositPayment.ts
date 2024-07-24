import {Transaction, ValidatedResponse} from "braintree";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {createTransactionRecordAndUpdateBalanceIfNeeded} from '../../services/transactionService';
import {createDepositTransactionInput} from "../../utils/transactionHelper";
import {gateway, merchantKey} from "../../utils/braintreeHelper";
import {logError, logInfo} from "../../utils/errorHandler";

// Process incoming deposit request using Braintree, update user's balance and record the deposit transaction.
export const processDepositPayment = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const {amount, paymentMethodNonce} = request.data;
    const userId = request.auth.uid;

    if (typeof amount !== 'number' || amount <= 0) {
        throw new HttpsError('invalid-argument', 'Invalid amount');
    }
    if (typeof paymentMethodNonce !== 'string' || !paymentMethodNonce) {
        throw new HttpsError('invalid-argument', 'Invalid payment Method Nonce');
    }

    try {
        // Make sale transaction using Braintree gateway
        const result = await processBraintreePayment(userId, amount, paymentMethodNonce);

        if (result.success) {
            // Sale transaction is successful, record transaction and update user's balance
            const transactionInput = createDepositTransactionInput(userId, result);
            const transactionRecord = await createTransactionRecordAndUpdateBalanceIfNeeded(transactionInput);

            logInfo('Deposit transaction is successful', {userId, transactionId: transactionRecord.id});
            return {
                status: 'successful',
                message: 'Payment deposited successfully',
            };
        } else {
            // Sale transaction failed, record transaction attempt
            const transactionInput = createDepositTransactionInput(userId, result);
            const transactionRecord = await createTransactionRecordAndUpdateBalanceIfNeeded(transactionInput);

            logInfo('Deposit transaction failed', {userId, transactionId: transactionRecord.id, reason: result.message});
            throw new HttpsError('aborted', result.message || 'Transaction failed');
        }
    } catch (error) {
        if (error instanceof HttpsError) {
            throw error;
        }

        logError('Unable to process deposit transaction', {userId, error});
        throw new HttpsError('internal', 'Error processing payment');
    }
});

async function processBraintreePayment(userId: string, amount: number, paymentMethodNonce: string): Promise<ValidatedResponse<Transaction>> {
    return gateway.transaction.sale({
        amount: amount.toFixed(2),
        paymentMethodNonce: paymentMethodNonce,
        merchantAccountId: merchantKey,
        customerId: userId,
        options: {submitForSettlement: true}
    });
}