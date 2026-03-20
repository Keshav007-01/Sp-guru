import express from "express";
import { log } from "./vite";

const app = express();

// Set up a simple HTML test page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Page</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 50px;
          background-color: #f0f0f0;
        }
        .container {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-width: 600px;
          margin: 0 auto;
        }
        h1 {
          color: #FF9933;
        }
        p {
          color: #333;
          line-height: 1.6;
        }
        .status {
          font-weight: bold;
          color: #4CAF50;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Hindu Mantra App - Server Running</h1>
        <p>This is a test page to verify the server is running properly.</p>
        <p class="status">Status: Server is responding ✓</p>
        <p>Server Time: ${new Date().toLocaleString()}</p>
        <p>API routes available:</p>
        <ul style="text-align: left; display: inline-block;">
          <li><a href="/api/deities">/api/deities</a> - Get all deities</li>
          <li><a href="/api/featured-mantra">/api/featured-mantra</a> - Get featured mantra</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// Add JSON API endpoints for testing
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'API is working properly' });
});

// Start the server on port 3000 (different from main app)
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  log(`Test server running at http://localhost:${PORT}`, 'test-server');
});