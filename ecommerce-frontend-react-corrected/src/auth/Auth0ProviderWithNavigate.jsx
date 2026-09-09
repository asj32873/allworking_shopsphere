import { Auth0Provider } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

export default function Auth0ProviderWithNavigate({ children }) {
  const navigate = useNavigate();

  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

  const onRedirectCallback = (appState) => {
    sessionStorage.setItem(
      "auth0_return_to",
      appState?.returnTo || "/user/home",
    );

    navigate("/auth/callback", {
      replace: true,
    });
  };

  if (!domain || !clientId || !audience) {
    console.error(
      "Auth0 configuration missing. Check VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID and VITE_AUTH0_AUDIENCE.",
    );

    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Auth0 configuration is missing. Check your frontend .env file.
        </div>
      </div>
    );
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      cacheLocation="memory"
      useRefreshTokens={true}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience,
        scope: "openid profile email",
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
}
