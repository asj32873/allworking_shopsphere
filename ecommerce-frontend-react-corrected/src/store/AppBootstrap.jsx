import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { loadAuthenticatedUser } from "./slices/authSlice";

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

  useEffect(() => {
    dispatch(loadProducts());
  }, [dispatch]);

  useEffect(() => {
    if (token && !user) {
      dispatch(loadAuthenticatedUser());
    }
  }, [dispatch, token, user]);

  useEffect(() => {
    if (!user) return;

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
