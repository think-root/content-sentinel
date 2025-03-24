import { Auth0Provider } from '@auth0/auth0-react';
import { ReactNode } from 'react';

const domain = import.meta.env.VITE_AUTH0_DOMAIN || '';
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || '';
const appUrl = import.meta.env.VITE_APP_URL || '';
const isDevelopment = import.meta.env.MODE === 'development';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const redirectUri = isDevelopment 
    ? `${window.location.origin}/dashboard/`
    : `${appUrl}/dashboard/`;

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      {children}
    </Auth0Provider>
  );
}; 