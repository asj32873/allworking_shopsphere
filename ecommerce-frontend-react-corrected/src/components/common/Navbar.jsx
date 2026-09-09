import { Link, useNavigate } from "react-router-dom";
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

  return (
    <nav className="navbar navbar-expand-lg bg-dark navbar-dark sticky-top shopsphere-navbar">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          ShopSphere
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav me-auto mb-3 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/products">
                Products
              </Link>
            </li>

            {user?.role === "USER" && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/orders">
                    Orders
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/issues">
                    Issues
                  </Link>
                </li>
              </>
            )}

            {user?.role === "VENDOR" && (
              <li className="nav-item">
                <Link className="nav-link" to="/vendor/dashboard">
                  Vendor
                </Link>
              </li>
            )}

            {user?.role === "ADMIN" && (
              <li className="nav-item">
                <Link className="nav-link" to="/admin/dashboard">
                  Admin
                </Link>
              </li>
            )}
          </ul>

          <div className="navbar-actions d-flex align-items-center gap-2">
            {user?.role === "USER" && (
              <Link className="btn btn-outline-light" to="/cart">
                <i className="bi bi-cart3 me-1" />
                Cart ({cartItems.length})
              </Link>
            )}

            {user ? (
              <>
                <Link className="btn btn-light" to="/profile">
                  <i className="bi bi-person me-1" />
                  {user.name}
                </Link>

                <button
                  className="btn btn-outline-light"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-1" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-outline-light" to="/vendor/register">
                  Become a Vendor
                </Link>

                <Link className="btn btn-primary" to="/login">
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
