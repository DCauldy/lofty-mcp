export function getAuthorizePage(
  clientId: string,
  redirectUri: string,
  state: string | undefined,
  codeChallenge: string,
  errorMessage?: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connect Lofty CRM</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 40px;
      max-width: 440px;
      width: 100%;
    }
    h1 { font-size: 24px; margin-bottom: 8px; color: #1a1a1a; }
    .subtitle { color: #666; margin-bottom: 24px; font-size: 14px; line-height: 1.5; }
    label { display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; color: #333; }
    input[type="text"] {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      font-family: monospace;
      margin-bottom: 8px;
    }
    input[type="text"]:focus { outline: none; border-color: #4a90d9; box-shadow: 0 0 0 3px rgba(74,144,217,0.1); }
    .help { font-size: 12px; color: #888; margin-bottom: 20px; }
    button {
      width: 100%;
      padding: 12px;
      background: #4a90d9;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover { background: #3a7bc8; }
    .error { background: #fee; border: 1px solid #fcc; color: #c00; padding: 10px; border-radius: 6px; margin-bottom: 16px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Connect Lofty CRM</h1>
    <p class="subtitle">Enter your Lofty API key to connect your account. You can find it in Lofty under Settings &gt; API.</p>
    ${errorMessage ? `<div class="error">${errorMessage}</div>` : ""}
    <form method="POST" action="/auth/callback">
      <label for="apiKey">API Key</label>
      <input type="text" id="apiKey" name="apiKey" placeholder="your-lofty-api-key" required autocomplete="off" />
      <p class="help">Your API key is encrypted and stored securely.</p>
      <input type="hidden" name="client_id" value="${clientId}" />
      <input type="hidden" name="redirect_uri" value="${redirectUri}" />
      <input type="hidden" name="code_challenge" value="${codeChallenge}" />
      ${state ? `<input type="hidden" name="state" value="${state}" />` : ""}
      <button type="submit">Connect</button>
    </form>
  </div>
</body>
</html>`;
}
