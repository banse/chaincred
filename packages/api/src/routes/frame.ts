import { Hono } from 'hono';
import { isValidAddress } from '@chaincred/common';

export const frameRoutes = new Hono();

/** POST /v1/frame — Farcaster Frame action callback */
frameRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const inputText = body?.untrustedData?.inputText?.trim() ?? '';

  const apiBase = process.env.API_BASE_URL || 'http://localhost:3001/v1';
  const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!inputText || !isValidAddress(inputText)) {
    // Error frame — retry with input
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${apiBase}/card/0x0000000000000000000000000000000000000000.png" />
  <meta property="fc:frame:input:text" content="Enter a valid Ethereum address" />
  <meta property="fc:frame:button:1" content="Try Again" />
  <meta property="fc:frame:button:1:action" content="post" />
  <meta property="fc:frame:post_url" content="${apiBase}/frame" />
</head>
<body>Invalid address. Please enter a valid Ethereum address.</body>
</html>`;
    return c.html(html);
  }

  const address = inputText.toLowerCase();
  const cardUrl = `${apiBase}/card/${address}.png`;
  const detailsUrl = `${frontendBase}/score/${address}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${cardUrl}" />
  <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
  <meta property="fc:frame:button:1" content="View Details" />
  <meta property="fc:frame:button:1:action" content="link" />
  <meta property="fc:frame:button:1:target" content="${detailsUrl}" />
  <meta property="fc:frame:input:text" content="Enter another address" />
  <meta property="fc:frame:button:2" content="Look Up" />
  <meta property="fc:frame:button:2:action" content="post" />
  <meta property="fc:frame:post_url" content="${apiBase}/frame" />
</head>
<body>ChainCred Score for ${address}</body>
</html>`;
  return c.html(html);
});
