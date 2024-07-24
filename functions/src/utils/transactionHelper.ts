import {FirestoreDataConverter, QueryDocumentSnapshot} from 'firebase-admin/firestore';
import {
    DepositTransaction,
    DepositTransactionInput,
    InitialBalanceTransactionInput,
    PurchaseTransactionInput,
    SimplifiedTransaction,
    Transaction,
} from '../types/transaction';
import {Product} from "../types/product";
import {Transaction as BraintreeTransaction, ValidatedResponse} from "braintree";

export const transactionConverter: FirestoreDataConverter<Transaction> = {
    toFirestore(transaction: Transaction): FirebaseFirestore.DocumentData {
        const {id, ...data} = transaction;

        return {
            ...data,
        };
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): Transaction {
        const data = snapshot.data();

        const baseTransaction = {
            id: snapshot.id,
            userId: data.userId,
            amount: data.amount,
            status: data.status,
            createdAt: data.createdAt.toDate().toISOString(),
            updatedAt: data.updatedAt.toDate().toISOString(),
        };

        switch (data.type) {
            case 'deposit':
                return {
                    ...baseTransaction,
                    type: 'deposit',
                    paymentMethod: data.paymentMethod,
                    currencyIsoCode: data.currencyIsoCode,
                    paymentDetails: data.paymentDetails,
                };
            case 'purchase':
                return {
                    ...baseTransaction,
                    type: 'purchase',
                    productId: data.productId,
                    productName: data.productName,
                };
            case 'initial_balance':
                return {
                    ...baseTransaction,
                    type: 'initial_balance',
                    isLast: data.isLast,
                    includedTransactions: data.includedTransactions,
                    previousInitialBalanceId: data.previousInitialBalanceId,
                };
            default:
                throw new Error(`Unknown type of Transaction: ${data.type}`);
        }
    },
};

export const simplifiedTransactionConverter: FirestoreDataConverter<SimplifiedTransaction> = {
    toFirestore(): FirebaseFirestore.DocumentData {
        return {};
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): SimplifiedTransaction {
        const data = snapshot.data();
        return {
            id: snapshot.id,
            type: data.type,
            amount: data.amount,
            currencyIsoCode: data.currencyIsoCode,
            transactionId: data.paymentDetails?.transactionId,
            paymentMethod: data.paymentMethod,
            cardLast4: data.paymentDetails?.cardDetails?.sourceCardLast4,
            cardType: data.paymentDetails?.cardDetails?.sourceCardType,
            productId: data.productId,
            productName: data.productName,
            createdAt: data.createdAt.toDate().toISOString(),
        };
    },
}

export function createDepositTransactionInput(userId: string, braintreeTransaction: ValidatedResponse<BraintreeTransaction>): DepositTransactionInput {
    const {transaction, success} = braintreeTransaction;
    const cardDetails = getTransactionCardDetails(transaction);

    return {
        userId,
        type: 'deposit',
        status: success ? 'success' : 'failure',
        amount: parseFloat(transaction.amount),
        currencyIsoCode: transaction.currencyIsoCode,
        paymentMethod: transaction.paymentInstrumentType,
        paymentDetails: {
            transactionId: transaction.id,
            transactionStatus: transaction.status,
            success,
            amount: transaction.amount,
            currencyIsoCode: transaction.currencyIsoCode,
            paymentInstrumentType: transaction.paymentInstrumentType,
            merchantAccountId: transaction.merchantAccountId,
            createdAt: transaction.createdAt,
            cardDetails: cardDetails,
            validationDetails: {
                processorResponseType: transaction.processorResponseType,
                processorResponseCode: transaction.processorResponseCode,
                processorResponseText: transaction.processorResponseText,
                additionalProcessorResponse: transaction.additionalProcessorResponse,
                cvvResponseCode: transaction.cvvResponseCode,
                avsStreetAddressResponseCode: transaction.avsStreetAddressResponseCode,
                avsPostalCodeResponseCode: transaction.avsPostalCodeResponseCode,
                avsErrorResponseCode: transaction.avsErrorResponseCode,
                gatewayRejectionReason: transaction.gatewayRejectionReason,
            }
        }
    };
}

export function createPurchaseTransactionInput(userId: string, product: Product): PurchaseTransactionInput {
    return {
        userId,
        type: 'purchase',
        status: 'success',
        amount: product.price,
        productId: product.id,
        productName: product.name,
    };
}

export function createInitialBalanceTransactionInput(userId: string): InitialBalanceTransactionInput {
    return {
        userId,
        type: 'initial_balance',
        status: 'success',
        amount: 0,
        isLast: true,
        includedTransactions: [],
        previousInitialBalanceId: 'START',
    };
}

export function getTransactionCardDetails(transaction: BraintreeTransaction): DepositTransaction['paymentDetails']['cardDetails'] {
    switch (transaction.paymentInstrumentType) {
        case 'credit_card':
            return {
                cardholderName: transaction.creditCard?.cardholderName,
                sourceCardType: transaction.creditCard?.cardType,
                sourceCardLast4: transaction.creditCard?.last4,
                virtualCardType: null,
                virtualCardLast4: null,
            };
        case 'android_pay_card':
            return {
                cardholderName: null,
                sourceCardType: transaction.androidPayCard?.sourceCardType,
                sourceCardLast4: transaction.androidPayCard?.sourceCardLast4,
                virtualCardType: transaction.androidPayCard?.virtualCardType,
                virtualCardLast4: transaction.androidPayCard?.virtualCardLast4,
            };
        default:
            return {
                cardholderName: null,
                sourceCardLast4: null,
                virtualCardLast4: null,
                virtualCardType: null,
                sourceCardType: null,
            };
    }
}