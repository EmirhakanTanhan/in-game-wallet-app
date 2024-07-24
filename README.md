# In-Game Wallet Application

## Overview

This application is an in-game wallet and product purchasing system. It allows users to make deposits using Card or Google Pay, and purchase in-game items. Business logic is detailed with balance calculation and transaction monitoring.

## Features

- User authentication
- Wallet balance management
- Deposit functionality using Braintree payment gateway
- Product purchases
- Transaction history

## Technologies Used

- TypeScript
- Firebase Functions
- Firebase Firestore
- Firebase Authentication
- Braintree Payment Gateway
- Vue.js

## Prerequisites

Before you begin, ensure you have met the following requirements (I can also provide some of these):


- Node.js

- npm

- Firebase CLI (`npm install -g firebase-tools`)

- A Firebase project set up in the Firebase Console (or use my Firebase project)

- Braintree account for payment processing (or use my Braintree config and account)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/EmirhakanTanhan/in-game-wallet-app.git
   cd in-game-wallet-app
   ```

2. Install dependencies for App:
   ```
   cd public
   npm install
   ```

3. Install dependencies for Firebase:
   ```
   cd ../functions
   npm install
   ```

4. Set up your Firebase project (or use my Firebase project):
   
   #### Execute only one of the followings!

   - If you want to use my Firebase project, update `"serve-local"` script in `functions/package.json`.
     ```json
     "scripts": {
       "serve-local": "npm run build && firebase emulators:start --project in-game-wallet-app --import=./src/config/emulator-data"
     }
     ```
   - If you want to set up your Firebase project
      ```
      cd ..
      firebase login
      firebase use --add
      ```
      Select your Firebase project when prompted.

5. Set up environment variables:
   
   - For macOS/Linux users:
      ```
      cd functions
      touch .runtimeconfig.json
      ```
   - For Windows users:
      ```
      cd functions
      echo {} > .runtimeconfig.json
      ```
     
   Paste the contents into the `.runtimeconfig.json` and replace the placeholder values with your actual Braintree credentials.
   ```json
   {
     "braintree": {
       "sandbox": {
         "merchant_id": "your_merchant_id",
         "public_key": "your_public_key",
         "private_key": "your_private_key",
         "merchant_key": "your_merchant_key"
       }
     }
   }
   ```

## Configuration

1. Project settings (including ports) are in `firebase.json`.

2. Firestore security rules are in `firestore.rules`.

## Running the Application Locally

1. Start the App:
   ```
   cd public
   npm run serve
   ```
   App will be available at http://localhost:7001/ by default.


2. Start Firebase emulators:

   Create another terminal
   ```
   cd functions
   npm run serve-local
   ```
   Emulator will be available at http://localhost:4000/ by default.

## Project Structure

```
functions/
├── src/
│   ├── functions/
│   │   ├── auth/
│   │   ├── payments/
│   │   ├── products/
│   │   └── transactions/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── config/
│   └── index.ts
├── package.json
public/
├── src/
│   └── App.vue
└── package.json
```

- `functions/`:
  - `functions/`: All Firebase functions
  - `services/`: Business logic and data access layers
  - `types/`: TypeScript type definitions
  - `utils/`: Utility functions and helpers
  - `config/`: Configuration files and dummy data
  - `.runtimeconfig.json`: Local environment variables (sensitive information)
- `public/`:
  - `App.vue`: Main Vue.js component
- `firebase.json`: Firebase configuration file
- `firestore.rules`: Security rules for Firestore