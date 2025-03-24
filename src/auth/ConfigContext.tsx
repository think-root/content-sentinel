import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface Config {
  API_BASE_URL: string;
  API_BEARER_TOKEN: string;
  DATE_FORMAT: string;
  TIMEZONE: string;
}

interface ConfigContextType {
  config: Config | null;
  isLoading: boolean;
  error: string | null;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth();
  const [config, setConfig] = useState<Config | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!isAuthenticated) {
        setConfig(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const token = await getAccessTokenSilently();
        
        const response = await fetch('/api/config', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch configuration: ${response.statusText}`);
        }

        const data = await response.json();
        setConfig(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch configuration');
        setConfig(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [isAuthenticated, getAccessTokenSilently]);

  return (
    <ConfigContext.Provider value={{ config, isLoading, error }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
} 