import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const app = express();
const PORT = process.env.PORT || process.env.VITE_PORT || 3000;

// The app used to live under /dashboard/; keep old bookmarks working.
app.get(/^\/dashboard(\/.*)?$/, (req, res) => {
  res.redirect(301, req.params[0] || '/');
});

app.use(express.static(distDir));

// Client-side routes get the SPA shell; a missing file must stay a 404, or the
// browser would receive index.html as a script or stylesheet.
app.get('*', (req, res) => {
  if (path.extname(req.path)) {
    return res.sendStatus(404);
  }
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
