import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice";
import productReducer from "./slices/productSlice";
import cartReducer from "./slices/cartSlice";
import orderReducer from "./slices/orderSlice";
import addressReducer from "./slices/addressSlice";
import issueReducer from "./slices/issueSlice";
import reviewReducer from "./slices/reviewSlice";
import vendorReducer from "./slices/vendorSlice";
import userReducer from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    cart: cartReducer,
    orders: orderReducer,
    addresses: addressReducer,
    issues: issueReducer,
    reviews: reviewReducer,
    vendors: vendorReducer,
    users: userReducer,
  },
});
