import {HttpsError, onCall} from  "firebase-functions/v2/https";
import {gateway} from "../../utils/braintreeHelper";

// Generate a client token for Braintree gateway.
export const generateClientToken = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required");
    }

    const {amount} = request.data;
    const userId = request.auth.uid;

    if (typeof amount !== "number" || amount <= 0) {
        throw new HttpsError("invalid-argument", "Invalid amount");
    }

    try {
        const response = await gateway.clientToken.generate({
            customerId: userId,
        });
        return {clientToken: response.clientToken};
    } catch (error) {
        console.error("Client token generation failed:", error);
        throw new HttpsError("internal", "Failed to generate client token");
    }
});