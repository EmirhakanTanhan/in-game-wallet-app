import {Transaction, ValidatedResponse} from "braintree";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {createTransactionRecordAndUpdateBalanceIfNeeded} from '../../services/transactionService';
import {createDepositTransactionInput} from "../../utils/transactionHelper";
import {gateway, CONST_MERCHANT_KEY} from "../../utils/braintreeHelper";

// Process incoming deposit request using Braintree, update user's balance and record the deposit transaction.
export const processDepositPayment = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required");
    }

    const {amount, paymentMethodNonce} = request.data;
    const userId = request.auth.uid;

    if (typeof amount !== "number" || amount <= 0) {
        throw new HttpsError("invalid-argument", "Invalid amount");
    }
    if (typeof paymentMethodNonce !== "string" || !paymentMethodNonce) {
        throw new HttpsError("invalid-argument", "Invalid payment Method Nonce");
    }

    try {
        // Make sale transaction using Braintree gateway
        const result = await processBraintreePayment(userId, amount, paymentMethodNonce);

        if (result.success) {
            // Sale transaction is successful, record transaction and update user's balance
            const transactionInput = createDepositTransactionInput(userId, result);
            await createTransactionRecordAndUpdateBalanceIfNeeded(transactionInput);

            return {
                success: true,
                message: 'Payment deposited successfully',
                result,
            };
        } else {
            // Sale transaction failed, record transaction attempt
            const transactionInput = createDepositTransactionInput(userId, result);
            await createTransactionRecordAndUpdateBalanceIfNeeded(transactionInput);

            console.error('Braintree payment failed:', result.message);
            throw new HttpsError("aborted", result.message || "Transaction failed", result);
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", "Error processing payment");
    }
});

async function processBraintreePayment(userId: string, amount: number, paymentMethodNonce: string): Promise<ValidatedResponse<Transaction>> {
    try {
        return await gateway.transaction.sale({
            amount: amount.toFixed(2),
            paymentMethodNonce: paymentMethodNonce,
            merchantAccountId: CONST_MERCHANT_KEY,
            // customerId: userId,
            options: {submitForSettlement: true}
        });
    } catch (error) {
        throw new Error(`Braintree payment failed: ${error}`);
    }
}