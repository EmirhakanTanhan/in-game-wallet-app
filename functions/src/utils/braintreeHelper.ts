import {BraintreeGateway, Environment} from "braintree";
import {config} from "../config/config";

// Merchant key determines in which merchant the payment is being made
export const merchantKey = config.braintree.merchantKey;

// Initialize braintree gateway
export const gateway = new BraintreeGateway({
    environment: Environment.Sandbox, // Using Sandbox for testing
    merchantId: config.braintree.merchantId,
    publicKey: config.braintree.publicKey,
    privateKey: config.braintree.privateKey,
});

