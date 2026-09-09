import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/common/Navbar";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VendorRegister from "./pages/VendorRegister";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";

// User pages
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Profile from "./pages/Profile";
import Addresses from "./pages/Addresses";
import Reviews from "./pages/Reviews";
import Issues from "./pages/Issues";

// Vendor pages
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorProductEdit from "./pages/vendor/VendorProductEdit";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorIssues from "./pages/vendor/VendorIssues";
import VendorProfile from "./pages/vendor/VendorProfile";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVendors from "./pages/admin/AdminVendors";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminIssues from "./pages/admin/AdminIssues";

// Payment pages
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* =====================================================
            PUBLIC ROUTES
        ===================================================== */}

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/vendor/register" element={<VendorRegister />} />

        <Route path="/products" element={<Products />} />

        <Route path="/products/:id" element={<ProductDetails />} />

        {/* Payment callbacks are public */}
        <Route path="/payment/success" element={<PaymentSuccess />} />

        <Route path="/payment/cancel" element={<PaymentCancel />} />

        {/* =====================================================
            USER ROUTES
        ===================================================== */}

        <Route element={<ProtectedRoute roles={["USER"]} />}>
          <Route path="/user/home" element={<Home />} />

          <Route path="/cart" element={<Cart />} />

          <Route path="/orders" element={<Orders />} />

          <Route path="/orders/:id" element={<OrderDetails />} />

          <Route path="/profile" element={<Profile />} />

          <Route path="/profile/addresses" element={<Addresses />} />

          <Route path="/profile/reviews" element={<Reviews />} />

          <Route path="/profile/issues" element={<Issues />} />

          <Route path="/issues" element={<Issues />} />
        </Route>

        {/* =====================================================
            VENDOR ROUTES
        ===================================================== */}

        <Route element={<ProtectedRoute roles={["VENDOR"]} />}>
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />

          <Route path="/vendor/products" element={<VendorProducts />} />

          <Route
            path="/vendor/products/create"
            element={<VendorProductEdit />}
          />

          <Route
            path="/vendor/products/:productId/edit"
            element={<VendorProductEdit />}
          />

          <Route path="/vendor/orders" element={<VendorOrders />} />

          <Route path="/vendor/issues" element={<VendorIssues />} />

          <Route path="/vendor/profile" element={<VendorProfile />} />
        </Route>

        {/* =====================================================
            ADMIN ROUTES
        ===================================================== */}

        <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="/admin/vendors" element={<AdminVendors />} />

          <Route path="/admin/users" element={<AdminUsers />} />

          <Route path="/admin/orders" element={<AdminOrders />} />

          <Route path="/admin/reviews" element={<AdminReviews />} />

          <Route path="/admin/issues" element={<AdminIssues />} />
        </Route>

        {/* =====================================================
            CATCH-ALL
        ===================================================== */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
