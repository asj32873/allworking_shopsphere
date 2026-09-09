import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import "./styles.css";

import App from "./App";
import { store } from "./store/store";
import AppBootstrap from "./store/AppBootstrap";
import Auth0ProviderWithNavigate from "./auth/Auth0ProviderWithNavigate";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Auth0ProviderWithNavigate>
          <AppBootstrap>
            <App />
          </AppBootstrap>
        </Auth0ProviderWithNavigate>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
