import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Auth0ProviderWithNavigate from "../../src/auth/Auth0ProviderWithNavigate";

const mockNavigate = jest.fn();
let capturedOnRedirectCallback;

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("@auth0/auth0-react", () => ({
  Auth0Provider: ({ children, onRedirectCallback }) => {
    capturedOnRedirectCallback = onRedirectCallback;
    return <div data-testid="auth0-provider">{children}</div>;
  },
}));

test("shows configuration error when Auth0 settings are unavailable", () => {
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  renderProvider();
  expect(
    screen.getByText(/Auth0 configuration is missing/i),
  ).toBeInTheDocument();
  expect(error).toHaveBeenCalled();
  error.mockRestore();
});

describe("with valid Auth0 configuration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.VITE_AUTH0_DOMAIN = "test.auth0.com";
    process.env.VITE_AUTH0_CLIENT_ID = "test-client-id";
    process.env.VITE_AUTH0_AUDIENCE = "test-audience";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("renders the Auth0Provider with children", () => {
    renderProvider();
    expect(screen.getByTestId("auth0-provider")).toBeInTheDocument();
    expect(screen.getByText("Child")).toBeInTheDocument();
  });

  test("navigates to the returnTo appState on redirect callback", () => {
    renderProvider();
    capturedOnRedirectCallback({ returnTo: "/vendor/home" });
    expect(mockNavigate).toHaveBeenCalledWith("/vendor/home", {
      replace: true,
    });
  });

  test("falls back to /user/home when no returnTo is provided", () => {
    renderProvider();
    capturedOnRedirectCallback();
    expect(mockNavigate).toHaveBeenCalledWith("/user/home", {
      replace: true,
    });
  });
});

function renderProvider() {
  const { render } = require("@testing-library/react");
  render(
    <MemoryRouter>
      <Auth0ProviderWithNavigate>Child</Auth0ProviderWithNavigate>
    </MemoryRouter>,
  );
}
