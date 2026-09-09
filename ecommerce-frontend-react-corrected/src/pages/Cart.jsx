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
      <div className="container py-5 text-center">
        <h2>Cart is empty</h2>

        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
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
    <div className="container py-4">
      <h2>Shopping Cart</h2>

      <div className="row g-4">
        <div className="col-lg-8">
          {cartItems.map((item) => {
            const product = item.product || item;

            const quantity = item.quantity || 1;

            return (
              <div className="card mb-3" key={item.id}>
                <div className="card-body d-flex gap-3 align-items-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{
                      width: 90,
                      height: 90,
                      objectFit: "cover",
                    }}
                  />

                  <div className="flex-grow-1">
                    <h5>{product.name}</h5>

                    <div>₹{Number(product.price).toLocaleString("en-IN")}</div>

                    <div className="mt-2 d-flex gap-2 align-items-center">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() =>
                          dispatch(
                            updateCartQty({
                              productId: item.productId || product.id,
                              quantity: quantity - 1,
                            }),
                          )
                        }
                      >
                        -
                      </button>

                      <span>{quantity}</span>

                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() =>
                          dispatch(
                            updateCartQty({
                              productId: item.productId || product.id,
                              quantity: quantity + 1,
                            }),
                          )
                        }
                      >
                        +
                      </button>

                      <button
                        className="btn btn-sm btn-outline-danger ms-2"
                        onClick={() =>
                          dispatch(removeFromCart(item.productId || product.id))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <strong>
                    ₹
                    {Number(
                      item.subtotal || product.price * quantity,
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h4>Order Summary</h4>

              <h3>₹{Number(cartTotal).toLocaleString("en-IN")}</h3>

              {paymentError && (
                <div className="alert alert-danger">{paymentError}</div>
              )}

              <label className="form-label mt-3">Delivery Address</label>

              <select
                className="form-select mb-3"
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

              {!addresses.length && (
                <Link
                  to="/profile/addresses"
                  className="btn btn-outline-primary w-100 mb-2"
                >
                  Add Address
                </Link>
              )}

              <button
                className="btn btn-success w-100"
                disabled={paymentLoading || !address}
                onClick={handleCheckout}
              >
                {paymentLoading ? "Starting Payment..." : "Checkout"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
