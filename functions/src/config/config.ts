import {config as firebaseConfig} from "firebase-functions";

export const config = {
    braintree: {
        merchantId: firebaseConfig().braintree.sandbox.merchant_id,
        publicKey: firebaseConfig().braintree.sandbox.public_key,
        privateKey: firebaseConfig().braintree.sandbox.private_key,
        merchantKey: firebaseConfig().braintree.sandbox.merchant_key
    },
    firebaseAdminServiceAccount: {
        type: firebaseConfig().serviceAccount.type,
        project_id: firebaseConfig().serviceAccount.project_id,
        private_key_id: firebaseConfig().serviceAccount.private_key_id,
        private_key: firebaseConfig().serviceAccount.private_key,
        client_email: firebaseConfig().serviceAccount.client_email,
        client_id: firebaseConfig().serviceAccount.client_id,
        auth_uri: firebaseConfig().serviceAccount.auth_uri,
        token_uri: firebaseConfig().serviceAccount.token_uri,
        auth_provider_x509_cert_url: firebaseConfig().serviceAccount.auth_provider_x509_cert_url,
        client_x509_cert_url: firebaseConfig().serviceAccount.client_x509_cert_url,
        universe_domain: firebaseConfig().serviceAccount.universe_domain,
    }
};