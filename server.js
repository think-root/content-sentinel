import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || process.env.VITE_PORT || 3000;

app.use('/dashboard', express.static(path.join(__dirname, 'dist')));

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
