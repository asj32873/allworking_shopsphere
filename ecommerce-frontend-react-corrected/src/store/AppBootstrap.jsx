import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useDispatch, useSelector } from "react-redux";

import {
  exchangeAuth0Token,
  finishBootstrap,
  loadAuthenticatedUser,
} from "./slices/authSlice";

import { loadProducts } from "./slices/productSlice";

import { loadCart } from "./slices/cartSlice";

import {
  loadUserOrders,
  loadVendorOrders,
  loadAdminOrders,
} from "./slices/orderSlice";

import { loadAddresses } from "./slices/addressSlice";

import { loadIssues } from "./slices/issueSlice";

import { loadVendorProfile, loadAdminVendors } from "./slices/vendorSlice";

import { loadAdminUsers } from "./slices/userSlice";

export default function AppBootstrap({ children }) {
  const dispatch = useDispatch();

  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const initialized = useSelector((state) => state.auth.initialized);

  const {
    isAuthenticated,
    isLoading: auth0Loading,
    getAccessTokenSilently,
  } = useAuth0();

  /*
   * -------------------------------------------------------
   * LOAD PRODUCTS
   * -------------------------------------------------------
   */
  useEffect(() => {
    dispatch(loadProducts());
  }, [dispatch]);

  /*
   * -------------------------------------------------------
   * AUTHENTICATION BOOTSTRAP
   *
   * Priority:
   *
   * 1. Existing ShopSphere JWT
   * 2. Auth0 session
   * 3. Anonymous user
   * -------------------------------------------------------
   */
  useEffect(() => {
    if (auth0Loading) {
      return;
    }

    if (initialized) {
      return;
    }

    let active = true;

    const bootstrapAuth = async () => {
      try {
        /*
         * -------------------------------------------------
         * EXISTING SHOPSPHERE JWT
         * -------------------------------------------------
         */
        if (token) {
          try {
            await dispatch(loadAuthenticatedUser()).unwrap();

            return;
          } catch {
            /*
             * Existing ShopSphere JWT is invalid.
             *
             * If Auth0 is also authenticated, we'll
             * fall through and exchange the Auth0 token.
             */
          }
        }

        /*
         * -------------------------------------------------
         * AUTH0 SESSION
         * -------------------------------------------------
         */
        if (isAuthenticated) {
          const auth0Token = await getAccessTokenSilently({
            authorizationParams: {
              audience: import.meta.env.VITE_AUTH0_AUDIENCE,
              scope: "openid profile email",
            },
          });

          await dispatch(exchangeAuth0Token(auth0Token)).unwrap();

          return;
        }
      } catch (error) {
        console.error("Authentication bootstrap failed:", error);
      } finally {
        if (active) {
          dispatch(finishBootstrap());
        }
      }
    };

    bootstrapAuth();

    return () => {
      active = false;
    };
  }, [
    dispatch,
    token,
    initialized,
    auth0Loading,
    isAuthenticated,
    getAccessTokenSilently,
  ]);

  /*
   * -------------------------------------------------------
   * LOAD USER-SPECIFIC DATA
   * -------------------------------------------------------
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    if (user.role === "USER") {
      dispatch(loadCart());
      dispatch(loadUserOrders());
      dispatch(loadAddresses());
      dispatch(loadIssues("/issues"));
    }

    if (user.role === "VENDOR") {
      dispatch(loadVendorProfile());
      dispatch(loadVendorOrders());
      dispatch(loadIssues("/issues/vendor"));
    }

    if (user.role === "ADMIN") {
      dispatch(loadAdminUsers());
      dispatch(loadAdminVendors());
      dispatch(loadAdminOrders());
      dispatch(loadIssues("/issues/admin"));
    }
  }, [dispatch, user]);

  return children;
}
