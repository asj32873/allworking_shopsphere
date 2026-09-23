import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import Addresses from "../../src/pages/Addresses";
import { renderWithProviders } from "../utils/testUtils";
import {
  addAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../src/store/slices/addressSlice";

jest.mock("../../src/store/slices/addressSlice", () => {
  const actual = jest.requireActual("../../src/store/slices/addressSlice");
  return {
    __esModule: true,
    ...actual,
    default: (state = { items: [], loading: false, error: null }) => state,
    loadAddresses: jest.fn(() => () => ({ unwrap: jest.fn() })),
    addAddress: jest.fn(() => () => ({ unwrap: jest.fn() })),
    deleteAddress: jest.fn(() => () => ({ unwrap: jest.fn() })),
    setDefaultAddress: jest.fn(() => () => ({ unwrap: jest.fn() })),
  };
});

describe("Addresses page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders address form and list of saved addresses", () => {
    const mockAddresses = [
      {
        id: "addr-1",
        type: "Home",
        addressLine: "Flat 402, Sunshine Apts",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        isDefault: true,
      },
    ];

    renderWithProviders(<Addresses />, {
      preloadedState: {
        addresses: { items: mockAddresses, loading: false },
      },
    });

    expect(screen.getByText("Add Address")).toBeInTheDocument();
    expect(screen.getByText("My Addresses")).toBeInTheDocument();
    expect(screen.getByText(/Flat 402, Sunshine Apts/)).toBeInTheDocument();
    expect(screen.getByText(/Mumbai/)).toBeInTheDocument();
    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  test("submits new address form", async () => {
    renderWithProviders(<Addresses />, {
      preloadedState: {
        addresses: { items: [], loading: false },
      },
    });

    fireEvent.change(screen.getByPlaceholderText("addressLine"), {
      target: { value: "123 Indiranagar" },
    });
    fireEvent.change(screen.getByPlaceholderText("city"), {
      target: { value: "Bengaluru" },
    });
    fireEvent.change(screen.getByPlaceholderText("state"), {
      target: { value: "Karnataka" },
    });
    fireEvent.change(screen.getByPlaceholderText("pincode"), {
      target: { value: "560038" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(addAddress).toHaveBeenCalledWith({
        type: "Home",
        addressLine: "123 Indiranagar",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560038",
      });
    });
  });

  test("handles deleting an address", () => {
    const mockAddresses = [
      {
        id: "addr-2",
        type: "Work",
        addressLine: "Tech Park",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411001",
        isDefault: false,
      },
    ];

    renderWithProviders(<Addresses />, {
      preloadedState: {
        addresses: { items: mockAddresses, loading: false },
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteAddress).toHaveBeenCalledWith("addr-2");
  });
});
