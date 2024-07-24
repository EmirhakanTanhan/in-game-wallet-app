<template>
  <div id="app">
    <h1>In-Game Wallet App</h1>
    <div v-if="user">
      <img :src="user.photoURL" alt="User profile"/>
      <p>Welcome, {{ user.displayName }}!</p>

      <div>
        <button @click="signOut">Sign Out</button>
      </div>

      <div>
        <button @click="processInitialBalancePayment">Manually Create Month-End Close</button>
      </div>

      <div class="dashboard">
        <h2>Your Wallet Balance</h2>
        <p>{{ formatAmount(balance) }}</p>

        <div class="failure-selection">
          <p>Failure option: </p>
          <select v-model="selectedFailureOptionValue" @change="handleFailure">
            <option v-for="failureOption in failureOptions" :key="failureOption.value" :value="failureOption.value">
              {{ failureOption.text }}
            </option>
          </select>
        </div>

        <input v-model.number="depositAmount" type="number" placeholder="Amount to add" :disabled="isDepositAmountDisabled">
        <button @click="showDropIn" :disabled="depositAmount <= 0 || isAddBalanceDisabled">
          Add Balance
        </button>

        <div v-if="showDropInUI">
          <div id="dropin-container"></div>
          <button @click="processDepositPayment" :disabled="isSubmitPaymentDisabled">Submit Payment</button>
        </div>

        <h2>Products</h2>
        <div v-for="product in products" :key="product.id" class="product">
          <h3>{{ product.name }}</h3>
          <p>Price: {{ formatAmount(product.price) }}</p>
          <button @click="processPurchasePayment(product)" :disabled="balance < product.price">
            Purchase
          </button>
        </div>

        <h2>Transaction History</h2>
        <table v-if="transactions.length">
          <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Description</th>
            <th>View Details</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="transaction in transactions" :key="transaction.id">
            <td>{{ formatDate(transaction.createdAt) }}</td>
            <td>{{ transaction.type }}</td>
            <td>{{ formatAmount(transaction.amount, transaction.currencyIsoCode) }}</td>
            <td>{{ formatDetail(transaction) }}</td>
            <td><button @click="getTransaction(transaction.id)">Details</button></td>
          </tr>
          </tbody>
        </table>
        <p v-else>No transactions found.</p>
      </div>
    </div>
    <div v-else>
      <button @click="signIn">Sign In with Google</button>
    </div>
  </div>
</template>

<script>
import {initializeApp} from 'firebase/app';
import {getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut,
  connectAuthEmulator
} from 'firebase/auth';
import {connectFunctionsEmulator, getFunctions, httpsCallable} from "firebase/functions";
import dropin from 'braintree-web-drop-in';

const firebaseConfig = {
  apiKey: "AIzaSyDYIlifV_8Sma7RLR2yugQv9kklDMhmVgs",
  authDomain: "in-game-wallet-app.firebaseapp.com",
  projectId: "in-game-wallet-app",
  storageBucket: "in-game-wallet-app.appspot.com",
  messagingSenderId: "622826913157",
  appId: "1:622826913157:web:b7c278cea6aafb777e58ec"
};

initializeApp(firebaseConfig);

const auth = getAuth();
const functions = getFunctions();
connectFunctionsEmulator(functions, "localhost", 5001);
connectAuthEmulator(auth, "http://localhost:9099");

// Cloud functions
const googleAuthSignIn = httpsCallable(functions, 'googleAuthSignIn');
const generateClientToken = httpsCallable(functions, 'generateClientToken');
const processDepositPayment = httpsCallable(functions, 'processDepositPayment');
const processPurchasePayment = httpsCallable(functions, 'processPurchasePayment');
const processInitialBalancePayment = httpsCallable(functions, 'processInitialBalancePayment');
const getBalance = httpsCallable(functions, 'getBalance');
const getTransaction = httpsCallable(functions, 'getTransaction');
const getTransactionList = httpsCallable(functions, 'getTransactionList');
const getProductList = httpsCallable(functions, 'getProductList');

export default {
  name: 'In-Game Wallet App',
  data() {
    return {
      user: null,
      balance: 0,
      depositAmount: null,
      isDepositAmountDisabled: false,
      isAddBalanceDisabled: false,
      isSubmitPaymentDisabled: false,
      products: [],
      transactions: [],
      showDropInUI: false,
      dropinInstance: null,
      failureOptions: [
        { value: 0, text: 'Successful Transaction' },
        { value: 2010, text: 'Card Issuer Declined CVV' },
        { value: 2001, text: 'Insufficient Funds' },
        { value: 2002, text: 'Limit Exceeded' },
        { value: 2004, text: 'Expired Card' },
        { value: 2013, text: 'Possible Stolen Card' },
      ],
      selectedFailureOptionValue: 0,
    };
  },
  methods: {
    async signIn() {
      const provider = new GoogleAuthProvider();

      try {
        const result = await signInWithPopup(auth, provider);
        this.user = result.user;

        await googleAuthSignIn();
      } catch (error) {
        console.error('Error in signIn:', error);
      }
    },

    async signOut() {
      try {
        await signOut(auth);

        this.user = null;
        this.balance = 0;
        this.depositAmount = null;
        this.products = [];
        this.transactions = [];
        this.showDropInUI = false;
        this.dropinInstance = null;
      } catch (error) {
        console.error("Error in signOut:", error);
      }
    },

    async getBalance() {
      try {
        const result = await getBalance();
        this.balance = result.data.balance;
      } catch (error) {
        console.error("Error in getBalance:", error);
      }
    },

    async processDepositPayment() {
      try {
        this.isSubmitPaymentDisabled = true;

        const {nonce} = await this.dropinInstance.requestPaymentMethod();
        await processDepositPayment({amount: this.depositAmount, paymentMethodNonce: nonce });

        this.showDropInUI = false;
        this.depositAmount = null;
        this.isDepositAmountDisabled = false;
        this.isSubmitPaymentDisabled = false;

        if (this.dropinInstance) {
          this.dropinInstance.teardown();
          this.dropinInstance = null;
        }

        alert("Payment successful!");
        this.updateUserInformation();
      } catch (error) {
        console.error("Error in processDepositPayment:", error);
        alert(`Payment failed: ${error.message}`);
      }
    },

    async processPurchasePayment(product) {
      if (this.balance < product.price) {
        alert("Insufficient balance");
        return;
      }

      try {
        await processPurchasePayment({productId: product.id});
        alert(`Successfully purchased ${product.name}`);
        this.updateUserInformation();
      } catch (error) {
        console.error("Error in processPurchasePayment:", error);
      }
    },

    async processInitialBalancePayment() {
      try {
        await processInitialBalancePayment();
        alert('Successfully created initial balance payment');
        this.updateUserInformation();
      } catch (error) {
        console.error('Error in processInitialBalancePayment:', error);
      }
    },

    async getProductList() {
      try {
        const productList = await getProductList();

        this.products = productList.data.allProduct;
      } catch (error) {
        console.error("Error in getProductList:", error);
      }
    },

    async getTransactionList() {
      try {
        const transactionList = await getTransactionList();
        this.transactions = transactionList.data.transactions;
      } catch (error) {
        console.error("Error in getTransactionList:", error);
      }
    },

    async getTransaction(transactionId) {
      try {
        const transaction = await getTransaction({ transactionId });
        console.log('Transaction Details:', transaction.data);
      } catch (error) {
        console.error('Error in getTransaction:', error);
      }
    },

    async showDropIn() {
      try {
        const result = await generateClientToken({amount: this.depositAmount});
        const clientToken = result.data.clientToken;

        this.showDropInUI = true;
        this.isDepositAmountDisabled = true;

        const overrides = {
          fields: {
            number: {
              placeholder: '5555 5555 5555 4444',
            },
            cvv: {
              placeholder: '999'
            }
          }
        };

        this.dropinInstance = await dropin.create({
          authorization: clientToken,
          container: '#dropin-container',
          vaultManager: true,
          preselectVaultedPaymentMethod: false,
          showDefaultPaymentMethodFirst: false,
          card: {
            cardholderName: {
              required: true,
            },
            overrides: overrides,
          },
          googlePay: {
            googlePayVersion: 2,
            // merchantId: 'Only on production',
            transactionInfo: {
              totalPriceStatus: 'FINAL',
              totalPrice: this.depositAmount.toFixed(2),
              currencyCode: 'USD'
            },
            allowedPaymentMethods: [{
              type: 'CARD',
              parameters: {
                billingAddressRequired: true,
                billingAddressParameters: {
                  format: 'FULL'
                }
              }
            }]
          }
        });
      } catch (error) {
        console.error("Error in showDropIn:", error);
        alert("Unable to initialize payment form.");
      }
    },

    handleFailure() {
      if (this.selectedFailureOptionValue) {
        this.depositAmount = this.selectedFailureOptionValue;
        this.isDepositAmountDisabled = true;
      } else {
        this.depositAmount = null;
        this.isDepositAmountDisabled = false;
      }
    },

    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString();
    },

    formatAmount(amount, currencyIsoCode = 'USD') {
      return `${amount.toFixed(2) + ' ' + currencyIsoCode}`;
    },

    formatDetail(transaction) {
      switch (transaction.type) {
        case 'deposit':
          return `Deposited with ${transaction.cardLast4} ${transaction.cardType}`;
        case 'purchase':
          return `Purchased ${transaction.productName}`;
        default:
          return null;
      }
    },

    updateUserInformation() {
      this.getBalance();
      this.getTransactionList();
    }
  },

  mounted() {
    onAuthStateChanged(auth, user => {
      this.user = user;
      if (user) {
        this.getBalance();
        this.getTransactionList();
        this.getProductList();
      }
    });
  }
};

</script>

<style>
#app {
  font-family: Avenir,serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

button {
  margin: 10px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-top: 20px;
}

.dashboard {
  max-width: 600px;
  margin: 0 auto;
}

.product {
  border: 1px solid #ddd;
  padding: 10px;
  margin: 10px 0;
}

.failure-selection {
  display: flex;
  justify-content: center;
  align-items: center;
}

.failure-selection p{
  padding-right: 10px;
}

#dropin-container {
  min-height: 300px;
}

input {
  padding: 5px;
  font-size: 16px;
}
</style>