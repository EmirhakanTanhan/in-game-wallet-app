import {HttpsError, onCall} from "firebase-functions/v2/https";
import {getTransactionById} from "../../services/transactionService";

// Get transaction details.
export const getTransaction = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required");
    }

    const {transactionId} = request.data;

    if (typeof transactionId !== "string" || !transactionId) {
        throw new HttpsError("invalid-argument", "Invalid transaction ID");
    }

    try {
        const transaction = await getTransactionById(transactionId);

        return {transaction};
    } catch (error) {
        console.error('Error fetching transaction details:', error);
        throw new HttpsError("internal", "Error fetching transaction details");
    }
});