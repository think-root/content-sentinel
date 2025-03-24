import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";

export const useAuth = () => {
  const { isAuthenticated, loginWithRedirect, logout, user, isLoading, getAccessTokenSilently } =
    useAuth0();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isAuthenticated) {
          await getAccessTokenSilently();
        }
      } catch {
        handleLogin();
      }
    };

    checkAuth();
  }, [isAuthenticated, getAccessTokenSilently]);

  const handleLogin = async () => {
    await loginWithRedirect({
      appState: { returnTo: '/dashboard/' },
      authorizationParams: {
        prompt: "login",
      },
    });
  };

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin + '/dashboard/login/'
      }
    });
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    login: handleLogin,
    logout: handleLogout,
  };
};
