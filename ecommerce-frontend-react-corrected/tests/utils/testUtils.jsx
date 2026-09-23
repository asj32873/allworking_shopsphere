import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../../src/store/slices/authSlice";
import productReducer from "../../src/store/slices/productSlice";
import cartReducer from "../../src/store/slices/cartSlice";
import orderReducer from "../../src/store/slices/orderSlice";
import addressReducer from "../../src/store/slices/addressSlice";
import issueReducer from "../../src/store/slices/issueSlice";
import reviewReducer from "../../src/store/slices/reviewSlice";
import vendorReducer from "../../src/store/slices/vendorSlice";
import userReducer from "../../src/store/slices/userSlice";

export function setupTestStore(preloadedState = {}) {
  return configureStore({
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
    preloadedState,
  });
}

export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = setupTestStore(preloadedState),
    route = "/",
    ...renderOptions
  } = {},
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    );
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
