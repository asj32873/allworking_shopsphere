import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import ReviewForm from "../../../src/components/products/ReviewForm";
import { renderWithProviders } from "../../utils/testUtils";
import { addReview, updateReview, deleteReview } from "../../../src/store/slices/reviewSlice";

jest.mock("../../../src/store/slices/reviewSlice", () => {
  const actual = jest.requireActual("../../../src/store/slices/reviewSlice");
  return {
    ...actual,
    addReview: jest.fn(() => () => ({
      unwrap: jest.fn().mockResolvedValue(true),
    })),
    updateReview: jest.fn(() => () => ({
      unwrap: jest.fn().mockResolvedValue(true),
    })),
    deleteReview: jest.fn(() => () => ({
      unwrap: jest.fn().mockResolvedValue(true),
    })),
  };
});

describe("ReviewForm component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders empty review form for new review", () => {
    renderWithProviders(<ReviewForm productId="p1" />);

    expect(screen.getByText("Write a Review")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit Review" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  test("validates empty review submission", async () => {
    renderWithProviders(<ReviewForm productId="p1" />);

    const textarea = screen.getByPlaceholderText("Share your experience...");
    fireEvent.change(textarea, { target: { value: "   " } });

    fireEvent.click(screen.getByRole("button", { name: "Submit Review" }));

    expect(await screen.findByText("Please enter a review.")).toBeInTheDocument();
    expect(addReview).not.toHaveBeenCalled();
  });

  test("submits valid new review", async () => {
    const onDone = jest.fn();
    renderWithProviders(<ReviewForm productId="p1" onDone={onDone} />);

    const textarea = screen.getByPlaceholderText("Share your experience...");
    fireEvent.change(textarea, { target: { value: "Great product quality!" } });

    fireEvent.click(screen.getByRole("button", { name: "Submit Review" }));

    await waitFor(() => {
      expect(addReview).toHaveBeenCalledWith({
        productId: "p1",
        rating: 5,
        review: "Great product quality!",
      });
      expect(onDone).toHaveBeenCalled();
    });
  });

  test("renders edit mode and handles update", async () => {
    const existingReview = {
      id: "rev-99",
      rating: 4,
      review: "Very good item.",
    };

    renderWithProviders(
      <ReviewForm productId="p1" existingReview={existingReview} />,
    );

    expect(screen.getByText("Edit Your Review")).toBeInTheDocument();
    const updateBtn = screen.getByRole("button", { name: "Update Review" });
    const deleteBtn = screen.getByRole("button", { name: "Delete" });
    expect(updateBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(updateReview).toHaveBeenCalledWith({
        id: "rev-99",
        data: {
          rating: 4,
          review: "Very good item.",
        },
      });
    });
  });

  test("handles review deletion in edit mode", async () => {
    const existingReview = {
      id: "rev-99",
      rating: 4,
      review: "Very good item.",
    };

    renderWithProviders(
      <ReviewForm productId="p1" existingReview={existingReview} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteReview).toHaveBeenCalledWith("rev-99");
    });
  });
});
