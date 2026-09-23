import { fireEvent, screen, waitFor } from "@testing-library/react";
import VendorRegister from "../../src/pages/VendorRegister";
import { api } from "../../src/api/client";
import { renderWithProviders } from "../utils/testUtils";

jest.mock("../../src/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

test("VendorRegister submits application and navigates to login", async () => {
  api.post.mockResolvedValue({ id: "v1" });
  renderWithProviders(<VendorRegister />);

  const textboxes = screen.getAllByRole("textbox");
  fireEvent.change(textboxes[0], { target: { value: "Asha" } });
  fireEvent.change(textboxes[1], { target: { value: "Asha Store" } });
  fireEvent.change(textboxes[2], { target: { value: "asha@example.com" } });
  fireEvent.change(textboxes[3], { target: { value: "1234567890" } });
  fireEvent.change(textboxes[4], { target: { value: "1 Main St" } });
  fireEvent.change(document.querySelector('input[type="password"]'), {
    target: { value: "secret123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Submit Application" }));

  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith(
      "/auth/vendor/register",
      expect.objectContaining({ storeName: "Asha Store" }),
    ),
  );
  await waitFor(() =>
    expect(screen.getByText("Application submitted")).toBeInTheDocument(),
  );
  expect(
    screen.getByRole("button", { name: "Go to Login" }),
  ).toBeInTheDocument();
});
