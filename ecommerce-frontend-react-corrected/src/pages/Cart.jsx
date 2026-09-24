import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import {
  loadCart,
  removeFromCart,
  updateCartQty,
} from "../store/slices/cartSlice";

import { loadAddresses } from "../store/slices/addressSlice";

import { createCheckoutSession } from "../store/slices/orderSlice";

export default function Cart() {
  const dispatch = useDispatch();
  const nav = useNavigate();

  const cartItems = useSelector((state) => state.cart.items);
  const cartTotal = useSelector((state) => state.cart.total);
  const addresses = useSelector((state) => state.addresses.items);

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    dispatch(loadCart());
    dispatch(loadAddresses());
  }, [dispatch]);

  useEffect(() => {
    if (!addresses.length) {
      setAddress("");
      return;
    }

    const defaultAddress = addresses.find((a) => a.isDefault);

    setAddress(String(defaultAddress?.id || addresses[0]?.id || ""));
  }, [addresses]);

  if (!cartItems.length) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty">
            <div className="cart-empty-icon">
              <i className="bi bi-cart3" />
            </div>

            <div className="cart-empty-eyebrow">YOUR CART</div>

            <h1 className="cart-empty-title">Your cart is empty</h1>

            <p className="cart-empty-description">
              Browse the ShopSphere catalog and add something you love.
            </p>

            <Link to="/products" className="cart-primary-button">
              Browse Products
              <i className="bi bi-arrow-right" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!address) {
      nav("/profile/addresses");
      return;
    }

    setPaymentLoading(true);
    setPaymentError("");

    try {
      const data = await dispatch(createCheckoutSession(address)).unwrap();

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setPaymentError("Unable to start payment.");
    } catch (error) {
      setPaymentError(error || "Payment failed.");
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="cart-page">
      <div className="container">
        <header className="cart-header">
          <div>
            <div className="cart-eyebrow">SHOPPING BAG</div>

            <h1 className="cart-title">Shopping Cart</h1>

            <p className="cart-subtitle">
              Review your items and complete your order.
            </p>
          </div>

          <div className="cart-item-count">
            {cartItems.length}{" "}
            {cartItems.length === 1 ? "item" : "items"}
          </div>
        </header>

        <div className="cart-layout">
          <main className="cart-items-column">
            <div className="cart-section-label">
              <span>Your Items</span>
              <span>{cartItems.length}</span>
            </div>

            <div className="cart-items-list">
              {cartItems.map((item) => {
                const product = item.product || item;
                const quantity = item.quantity || 1;
                const productId = item.productId || product.id;

                const subtotal =
                  item.subtotal || product.price * quantity;

                return (
                  <article
                    className="cart-item-card"
                    key={item.id || productId}
                  >
                    <div className="cart-item-image-wrap">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="cart-item-image"
                        />
                      ) : (
                        <div className="cart-item-no-image">
                          <i className="bi bi-image" />
                        </div>
                      )}
                    </div>

                    <div className="cart-item-content">
                      <div className="cart-item-main">
                        <div className="cart-item-meta">
                          {product.brand || "ShopSphere"}
                        </div>

                        <h2 className="cart-item-name">
                          {product.name}
                        </h2>

                        <div className="cart-item-unit-price">
                          ₹
                          {Number(product.price).toLocaleString(
                            "en-IN",
                          )}{" "}
                          each
                        </div>
                      </div>

                      <div className="cart-item-bottom">
                        <div className="cart-quantity-control">
                          <button
                            type="button"
                            className="cart-quantity-button"
                            aria-label={`Decrease quantity of ${product.name}`}
                            disabled={quantity <= 1}
                            onClick={() =>
                              dispatch(
                                updateCartQty({
                                  productId,
                                  quantity: quantity - 1,
                                }),
                              )
                            }
                          >
                            −
                          </button>

                          <span className="cart-quantity-value">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            className="cart-quantity-button"
                            aria-label={`Increase quantity of ${product.name}`}
                            onClick={() =>
                              dispatch(
                                updateCartQty({
                                  productId,
                                  quantity: quantity + 1,
                                }),
                              )
                            }
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="cart-remove-button"
                          onClick={() =>
                            dispatch(removeFromCart(productId))
                          }
                        >
                          <i className="bi bi-trash3" />
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="cart-item-total">
                      <span className="cart-item-total-label">
                        Subtotal
                      </span>

                      <strong>
                        ₹
                        {Number(subtotal).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </article>
                );
              })}
            </div>

            <Link
              to="/products"
              className="cart-continue-shopping"
            >
              <i className="bi bi-arrow-left" />
              Continue shopping
            </Link>
          </main>

          <aside className="cart-summary">
            <div className="cart-summary-header">
              <div className="cart-summary-eyebrow">
                ORDER SUMMARY
              </div>

              <h2>Order Summary</h2>
            </div>

            <div className="cart-summary-total">
              <span>Total</span>

              <strong>
                ₹{Number(cartTotal).toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="cart-summary-divider" />

            {paymentError && (
              <div className="cart-payment-error">
                <i className="bi bi-exclamation-circle" />
                <span>{paymentError}</span>
              </div>
            )}

            <div className="cart-address-section">
              <label
                htmlFor="cart-address"
                className="cart-address-label"
              >
                Delivery Address
              </label>

              {addresses.length ? (
                <select
                  id="cart-address"
                  className="cart-address-select"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                >
                  <option value="">Select Address</option>

                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.type}: {a.addressLine}, {a.city}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="cart-no-address">
                  <i className="bi bi-geo-alt" />

                  <div>
                    <strong>No delivery address</strong>

                    <span>
                      Add an address before checking out.
                    </span>
                  </div>
                </div>
              )}

              {!addresses.length && (
                <Link
                  to="/profile/addresses"
                  className="cart-add-address-button"
                >
                  <i className="bi bi-plus-circle" />
                  Add Address
                </Link>
              )}
            </div>

            <button
              type="button"
              className="cart-checkout-button"
              disabled={paymentLoading || !address}
              onClick={handleCheckout}
            >
              {paymentLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  />

                  Starting Payment...
                </>
              ) : (
                <>
                  Checkout
                  <i className="bi bi-arrow-right" />
                </>
              )}
            </button>

            <div className="cart-secure-note">
              <i className="bi bi-shield-check" />

              <span>
                Secure checkout powered by Stripe
              </span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}