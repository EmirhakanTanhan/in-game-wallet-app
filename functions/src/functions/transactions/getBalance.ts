import {HttpsError, onCall} from "firebase-functions/v2/https";
import {getUserBalance} from "../../services/balanceService";
import {logError} from "../../utils/errorHandler";

// Get user's wallet balance. This function doesn't calculate current balance,
// it only fetches the walletBalance field for quick access
export const getBalance = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const userId = request.auth.uid;

    try {
        const userBalance = await getUserBalance(userId);

        return {balance: userBalance};
    } catch (error) {
        logError('Unable to fetch balance', {userId, error});
        throw new HttpsError('internal', 'Unable to fetch user balance:');
    }
});