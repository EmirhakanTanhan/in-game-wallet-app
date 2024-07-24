import {config as firebaseConfig} from "firebase-functions";

export const config = {
    braintree: {
        merchantId: firebaseConfig().braintree.sandbox.merchant_id,
        publicKey: firebaseConfig().braintree.sandbox.public_key,
        privateKey: firebaseConfig().braintree.sandbox.private_key,
        merchantKey: firebaseConfig().braintree.sandbox.merchant_key
    }
};