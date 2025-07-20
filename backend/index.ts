import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { handleRoute } from './routes.js';
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const server = createServer(async (req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(__dirname, '..', 'frontend', 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.end('Not found');
      } else {
        res.setHeader('Content-Type', 'text/html');
        res.end(data);
      }
    });
    return;
  }
  if (req.url?.startsWith('/static/')) {
    const filePath = path.join(__dirname, '..', 'frontend', req.url.replace('/static/', ''));
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.end('Not found');
      } else {
        res.end(data);
      }
    });
    return;
  }
 
  await handleRoute(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
