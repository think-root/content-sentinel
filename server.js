import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const API_BASE_URL = process.env.API_BASE_URL;

app.use('/dashboard', express.static(path.join(__dirname, 'dist')));

app.use('/api', createProxyMiddleware({
  target: `${API_BASE_URL}/api`,
  changeOrigin: true,
  pathRewrite: {
    '^/api': ''
  }
}));

app.get('*', (req, res) => {
  if (req.path === '/') {
    return res.redirect('/dashboard/');
  }
  if (req.path.startsWith('/dashboard/')) {
    return res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
  res.redirect('/dashboard/');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
