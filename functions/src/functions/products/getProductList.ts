import {onCall, HttpsError} from "firebase-functions/v2/https";
import {getAllProduct} from "../../services/productService";
import {logError} from "../../utils/errorHandler";

// Get all products.
export const getProductList = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Authentication required');
    }

    try {
        const allProduct = await getAllProduct();

        return {allProduct};
    } catch (error) {
        logError('Unable to fetch product list', {error});
        throw new HttpsError('internal', 'Error fetching products');
    }
});
