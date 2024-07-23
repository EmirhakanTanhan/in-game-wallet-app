import {initializeApp} from "firebase-admin/app";
import {onCall, HttpsError} from "firebase-functions/v2/https";

// Initialize app
initializeApp();

// Import functions
import {googleAuthSignIn} from "./functions/auth/googleAuthSignIn";
import {generateClientToken} from "./functions/payments/generateClientToken";
import {processDepositPayment} from "./functions/payments/processDepositPayment";
import {processPurchasePayment} from "./functions/payments/processPurchasePayment";
import {processInitialBalancePayment} from "./functions/payments/processInitialBalancePayment";
import {getProductList} from "./functions/products/getProductList";
import {getBalance} from "./functions/transactions/getBalance";
import {getTransactionList} from "./functions/transactions/getTransactionList";
import {getTransaction} from "./functions/transactions/getTransaction";

// Export functions
export {
    googleAuthSignIn,
    generateClientToken,
    processDepositPayment,
    processPurchasePayment,
    processInitialBalancePayment,
    getBalance,
    getTransaction,
    getTransactionList,
    getProductList,
}

// Middleware for auth
onCall((request) => {
    const {auth} = request;

    if (!auth) {
        throw new HttpsError("unauthenticated", "Authentication required");
    }
});
