import { NavLink, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { logout } from "../../store/slices/authSlice";
import { clearCart } from "../../store/slices/cartSlice";
import { clearOrders } from "../../store/slices/orderSlice";
import { clearAddresses } from "../../store/slices/addressSlice";
import { clearIssues } from "../../store/slices/issueSlice";
import { clearReviews } from "../../store/slices/reviewSlice";
import { clearUsers } from "../../store/slices/userSlice";
import { clearVendors } from "../../store/slices/vendorSlice";

export default function Navbar() {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const cartItems = useSelector((state) => state.cart.items);

  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());

    dispatch(clearCart());
    dispatch(clearOrders());
    dispatch(clearAddresses());
    dispatch(clearIssues());
    dispatch(clearReviews());
    dispatch(clearUsers());
    dispatch(clearVendors());

    navigate("/");
  };

  const navLinkClass = ({ isActive }) =>
    `shopsphere-nav-link${isActive ? " active" : ""}`;

  return (
    <nav className="navbar navbar-expand-lg sticky-top shopsphere-navbar">
      <div className="container">
        <Link className="navbar-brand shopsphere-brand" to="/">
          <span className="shopsphere-brand-mark">S</span>
          <span>ShopSphere</span>
        </Link>

        <button
          className="navbar-toggler shopsphere-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="shopsphere-toggler-icon">
            <span />
            <span />
            <span />
          </span>
        </button>

        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav shopsphere-nav me-auto">
            <li className="nav-item">
              <NavLink to="/products" className={navLinkClass}>
                Products
              </NavLink>
            </li>

            {user?.role === "USER" && (
              <>
                <li className="nav-item">
                  <NavLink to="/orders" className={navLinkClass}>
                    Orders
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink to="/issues" className={navLinkClass}>
                    Issues
                  </NavLink>
                </li>
              </>
            )}

            {user?.role === "VENDOR" && (
              <li className="nav-item">
                <NavLink to="/vendor/dashboard" className={navLinkClass}>
                  Vendor
                </NavLink>
              </li>
            )}

            {user?.role === "ADMIN" && (
              <li className="nav-item">
                <NavLink to="/admin/dashboard" className={navLinkClass}>
                  Admin
                </NavLink>
              </li>
            )}
          </ul>

          <div className="navbar-actions shopsphere-actions">
            {user?.role === "USER" && (
              <Link className="shopsphere-cart-link" to="/cart">
                <i className="bi bi-cart3" />
                <span>Cart</span>
                <span className="shopsphere-cart-count">
                  {cartItems.length}
                </span>
              </Link>
            )}

            {user ? (
              <>
                <Link className="shopsphere-profile-link" to="/profile">
                  <span className="shopsphere-profile-icon">
                    <i className="bi bi-person" />
                  </span>

                  <span className="shopsphere-profile-name">
                    {user.name}
                  </span>
                </Link>

                <button
                  className="shopsphere-logout"
                  onClick={handleLogout}
                  type="button"
                >
                  <i className="bi bi-box-arrow-right" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  className="shopsphere-vendor-link"
                  to="/vendor/register"
                >
                  Become a Vendor
                </Link>

                <Link className="shopsphere-login-link" to="/login">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}