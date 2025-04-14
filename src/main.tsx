const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

document.documentElement.classList.toggle('dark', initialTheme === 'dark');

const metaThemeColor = document.querySelector('meta[name="theme-color"]');
if (metaThemeColor) {
  metaThemeColor.setAttribute('content', initialTheme === 'dark' ? '#111827' : '#ffffff');
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

window.clearApiCache = function (): Promise<string> {
  localStorage.removeItem('cache_repositories_key');
  return Promise.resolve('Cache cleared successfully');
};