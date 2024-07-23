import {FieldValue} from "firebase-admin/firestore";

export interface BaseTransaction {
    id: string;
    userId: string;
    type: 'deposit' | 'purchase' | 'initial_balance';
    amount: number;
    status: 'success' | 'failure';
    createdAt: FieldValue | string;
    updatedAt: FieldValue | string;
}

export interface DepositTransaction extends BaseTransaction {
    type: 'deposit';
    paymentMethod: string;
    currencyIsoCode: string;
    paymentDetails: {
        transactionId: string;
        transactionStatus: string;
        success: boolean;
        amount: string;
        currencyIsoCode: string;
        paymentInstrumentType: string;
        merchantAccountId?: string | null;
        createdAt: string;
        cardDetails: {
            cardholderName?: string | null,
            sourceCardType?: string | null;
            sourceCardLast4?: string | null;
            virtualCardType?: string | null;
            virtualCardLast4?: string | null;
        };
        validationDetails: {
            processorResponseType: string,
            processorResponseCode: string;
            processorResponseText: string;
            additionalProcessorResponse?: string,
            cvvResponseCode?: string,
            avsStreetAddressResponseCode?: string,
            avsPostalCodeResponseCode?: string,
            avsErrorResponseCode?: string,
            gatewayRejectionReason?: string,
        };
    };
}

export interface PurchaseTransaction extends BaseTransaction {
    type: 'purchase';
    productId: string;
    productName: string;
}

export interface InitialBalanceTransaction extends BaseTransaction {
    type: 'initial_balance';
    isLast: boolean;
    includedTransactions: string[];
    previousInitialBalanceId: string;
}

export type Transaction = DepositTransaction | PurchaseTransaction | InitialBalanceTransaction;

export type DepositTransactionInput = Omit<DepositTransaction, 'id' | 'createdAt' | 'updatedAt'>;
export type PurchaseTransactionInput = Omit<PurchaseTransaction, 'id' | 'createdAt' | 'updatedAt'>;
export type InitialBalanceTransactionInput = Omit<InitialBalanceTransaction, 'id' | 'createdAt' | 'updatedAt'>;

export type TransactionInput = DepositTransactionInput | PurchaseTransactionInput | InitialBalanceTransactionInput;

// Simplified Transaction model for user
export interface SimplifiedTransaction {
    id: string;
    transactionId?: string;
    type: string;
    amount: number;
    currencyIsoCode?: string;
    cardType?: string;
    cardLast4?: string;
    productId?: string;
    productName?: string;
    paymentMethod?: string;
    createdAt: string;
}