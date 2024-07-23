import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getUserBalance} from '../../services/balanceService';
import {createTransactionRecordAndUpdateBalanceIfNeeded} from '../../services/transactionService';
import {getProductById} from "../../services/productService";
import {createPurchaseTransactionInput} from "../../utils/transactionHelper";

// Process user's purchase request, update user's balance and record the purchase transaction
export const processPurchasePayment = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required");
    }

    const userId = request.auth.uid;
    const {productId} = request.data;

    if (!productId) {
        throw new HttpsError("invalid-argument", "Product ID is required");
    }

    try {
        // Fetch the product
        const product = await getProductById(productId);

        if (!product) {
            throw new HttpsError("not-found", "Product not found");
        }

        // Fetch user's balance
        const userBalance = await getUserBalance(userId);

        if (userBalance < product.price) {
            throw new HttpsError("failed-precondition", "Insufficient balance");
        }

        // Record transaction and update user balance
        const transactionInput = createPurchaseTransactionInput(userId, product);
        await createTransactionRecordAndUpdateBalanceIfNeeded(transactionInput);

        return {
            success: true,
            message: 'Product purchased successfully',
        };
    } catch (error) {
        if (error instanceof HttpsError) {
            throw error;
        }

        throw new HttpsError("internal", "Error processing purchase");
    }
});