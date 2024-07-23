import {HttpsError, onCall} from "firebase-functions/v2/https";
import {getSimplifiedTransactionsByUserId} from "../../services/transactionService";

// Get transaction history of the user, limited by 15 items.
export const getTransactionList = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required");
    }

    const userId = request.auth.uid;

    try {
        const transactions = await getSimplifiedTransactionsByUserId(userId);

        return {transactions};
    } catch (error) {
        console.error("Error fetching transaction history:", error);
        throw new HttpsError("internal", "Error fetching transaction history");
    }
});