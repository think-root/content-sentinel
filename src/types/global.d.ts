interface Window {
  clearApiCache: () => Promise<string>;
  clearAllCaches?: () => string;
}
