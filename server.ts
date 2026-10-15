import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Cloud Run automatically sets the PORT environment variable (usually 8080).
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Cloud Run readiness and liveness probe
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'dad-json-viewer',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Proxy route to bypass CORS when fetching JSON from remote endpoints or buckets
app.get('/api/proxy-json', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    res.status(400).json({ error: 'Missing url query parameter' });
    return;
  }

  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      res.status(400).json({ error: 'Only http and https protocols supported' });
      return;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'CoreJSON-Enterprise-Inspector/1.0',
        Accept: 'application/json, text/plain, */*',
      },
    });

    if (!response.ok) {
      res.status(response.status).json({
        error: `Remote server responded with ${response.status}: ${response.statusText}`,
      });
      return;
    }

    const contentType = response.headers.get('content-type') || 'application/json';
    const body = await response.text();

    res.setHeader('Content-Type', contentType);
    res.status(200).send(body);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch remote JSON' });
  }
});

// In production, serve static files from dist
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA routing
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[DAD JSON Viewer] Server listening on http://0.0.0.0:${PORT}`);
  console.log(`[DAD JSON Viewer] Cloud Run health probe at http://0.0.0.0:${PORT}/healthz`);
});
