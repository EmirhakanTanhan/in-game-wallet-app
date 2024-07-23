import {HttpsError, onCall} from "firebase-functions/v2/https";
import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";
import {createUser, updateUserById, getUserById} from "../../services/userService";
import {createTransactionRecordAndUpdateBalanceIfNeeded} from "../../services/transactionService";
import {createInitialBalanceTransactionInput} from "../../utils/transactionHelper";
import {createUserInput} from "../../utils/userHelper";
import {User} from "../../types/user";
import {gateway} from "../../utils/braintreeHelper";

// Sign-in with Google Auth, create user if user doesn't exist.
export const googleAuthSignIn = onCall(async (request): Promise<User> => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required");
    }

    const userId = request.auth.uid;

    try {
        // Check if the user already exists in Firestore
        let user = await getUserById(userId);

        if (!user) {
            // If user doesn't exist in Firestore, create a new user and perform an initial balance transaction
            user = await saveUserAndCreateInitialBalanceTransaction(userId);
        } else {
            // If user exists, update their last login time
            await updateUserById(userId, {lastLoginAt: FieldValue.serverTimestamp()});

            // Update the lastLoginAt field of the user locally instead of making another call to Firestore
            user = {
                ...user,
                lastLoginAt: Timestamp.now(),
            };
        }

        return user;
    } catch (error) {
        console.error('Error processing sign-in:', error);
        throw new HttpsError('internal', 'Error processing sign-in');
    }
});

// Save user in the Firestore, create an Initial Balance for the user, and create a customer profile for user in Braintree
async function saveUserAndCreateInitialBalanceTransaction(userId: string): Promise<User> {
    const auth = getAuth();

    try {
        // Get user information from Google auth
        const userRecord = await auth.getUser(userId);

        // Create user in Firestore
        const userInput = createUserInput(userRecord);
        const newUser = await createUser(userId, userInput);

        // Record initial balance for user
        const transactionInput = createInitialBalanceTransactionInput(userId);
        await createTransactionRecordAndUpdateBalanceIfNeeded(transactionInput);

        // Save user as customer in Braintree
        await gateway.customer.create({
            id: newUser.id,
            email: newUser.email,
        });

        return newUser;
    } catch (error) {
        console.error('Error creating user:', error);
        throw new HttpsError('internal', 'Error creating user');
    }
}