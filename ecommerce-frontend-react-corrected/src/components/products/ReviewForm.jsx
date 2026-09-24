import { useState } from "react";
import { useDispatch } from "react-redux";

import {
  addReview,
  updateReview,
  deleteReview,
} from "../../store/slices/reviewSlice";

export default function ReviewForm({
  productId,
  existingReview = null,
  onDone,
}) {
  const dispatch = useDispatch();

  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [review, setReview] = useState(existingReview?.review || "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const editing = Boolean(existingReview);

  const submit = async (e) => {
    e.preventDefault();

    setMsg("");

    if (!review.trim()) {
      setMsg("Please enter a review.");
      return;
    }

    setBusy(true);

    try {
      if (editing) {
        await dispatch(
          updateReview({
            id: existingReview.id,
            data: {
              rating,
              review: review.trim(),
            },
          }),
        ).unwrap();

        setMsg("Review updated successfully.");
      } else {
        await dispatch(
          addReview({
            productId,
            rating,
            review: review.trim(),
          }),
        ).unwrap();

        setReview("");
        setRating(5);

        setMsg("Review submitted successfully.");
      }

      if (onDone) {
        onDone();
      }
    } catch (error) {
      setMsg(error.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!existingReview) return;

    setBusy(true);
    setMsg("");

    try {
      await dispatch(deleteReview(existingReview.id)).unwrap();

      setMsg("Review deleted.");

      if (onDone) {
        onDone();
      }
    } catch (error) {
      setMsg(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card mt-3 product-review-form-card">
      <div className="card-body">

        {/* Header */}
        <div className="product-review-form-header">
          <div>
            <div className="product-review-form-eyebrow">
              {editing ? "YOUR REVIEW" : "SHARE YOUR EXPERIENCE"}
            </div>

            <h5 className="product-review-form-title">
              {editing ? "Edit Your Review" : "Write a Review"}
            </h5>
          </div>

          <div className="product-review-form-star">
            ★
          </div>
        </div>

        {/* Status Message */}
        {msg && (
          <div className="alert alert-info py-2 product-review-form-message">
            {msg}
          </div>
        )}

        <form onSubmit={submit}>

          {/* Rating */}
          <div className="product-review-field">
            <label className="form-label">
              Rating
            </label>

            <select
              className="form-select"
              value={rating}
              onChange={(e) =>
                setRating(Number(e.target.value))
              }
            >
              {[5, 4, 3, 2, 1].map((x) => (
                <option key={x} value={x}>
                  {x} ★
                </option>
              ))}
            </select>
          </div>

          {/* Review */}
          <div className="product-review-field">
            <label className="form-label">
              Review
            </label>

            <textarea
              className="form-control"
              rows="4"
              maxLength={2000}
              value={review}
              onChange={(e) =>
                setReview(e.target.value)
              }
              placeholder="Share your experience..."
              required
            />

            <div className="product-review-counter">
              {review.length}/2000
            </div>
          </div>

          {/* Actions */}
          <div className="product-review-form-actions">

            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
            >
              {busy
                ? "Saving..."
                : editing
                  ? "Update Review"
                  : "Submit Review"}
            </button>

            {editing && (
              <button
                type="button"
                className="btn btn-outline-danger"
                disabled={busy}
                onClick={remove}
              >
                Delete
              </button>
            )}

          </div>

        </form>
      </div>
    </div>
  );
}