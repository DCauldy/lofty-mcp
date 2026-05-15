function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getAuthorizePage(
  clientId: string,
  redirectUri: string,
  state: string | undefined,
  codeChallenge: string,
  errorMessage?: string,
  oauthStartUrl?: string
): string {
  const showOAuth = !!oauthStartUrl;

  const safeClientId = escapeHtml(clientId);
  const safeRedirectUri = escapeHtml(redirectUri);
  const safeState = state ? escapeHtml(state) : undefined;
  const safeCodeChallenge = escapeHtml(codeChallenge);
  const safeError = errorMessage ? escapeHtml(errorMessage) : undefined;
  const safeOauthUrl = oauthStartUrl ? escapeHtml(oauthStartUrl) : undefined;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connect Lofty CRM</title>
  <link rel="icon" type="image/png" href="/favicon.png" />
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
    .logos {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .logos span {
      font-size: 22px;
      color: #bbb;
      font-weight: 300;
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
    .btn-primary {
      display: block;
      width: 100%;
      padding: 12px;
      background: #4a90d9;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
    }
    .btn-primary:hover { background: #3a7bc8; }
    .btn-submit {
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
    .btn-submit:hover { background: #3a7bc8; }
    .btn-oauth {
      background: #1a1a1a;
    }
    .btn-oauth:hover { background: #333; }
    .divider {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 24px 0;
      color: #999;
      font-size: 13px;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #ddd;
    }
    .error { background: #fee; border: 1px solid #fcc; color: #c00; padding: 10px; border-radius: 6px; margin-bottom: 16px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logos">
      <img src="/logo.svg" alt="AiM Marketing Academy" style="height: 44px;" />
      <span>&times;</span>
      <img src="/product-logo.svg" alt="Lofty CRM" style="height: 32px;" />
    </div>
    <h1>Connect Lofty CRM</h1>
    <p class="subtitle">Connect your Lofty CRM account to get started.</p>
    ${safeError ? `<div class="error">${safeError}</div>` : ""}
    ${showOAuth ? `
    <a href="${safeOauthUrl}" class="btn-primary btn-oauth">Sign in with Lofty</a>
    <div class="divider">or</div>
    ` : ""}
    <form method="POST" action="/auth/callback">
      <label for="apiKey">API Key</label>
      <input type="text" id="apiKey" name="apiKey" placeholder="your-lofty-api-key" required autocomplete="off" />
      <p class="help">Find your API key in Lofty under Settings &gt; API. Your key is encrypted and stored securely.</p>
      <input type="hidden" name="client_id" value="${safeClientId}" />
      <input type="hidden" name="redirect_uri" value="${safeRedirectUri}" />
      <input type="hidden" name="code_challenge" value="${safeCodeChallenge}" />
      ${safeState ? `<input type="hidden" name="state" value="${safeState}" />` : ""}
      <button type="submit" class="btn-submit">Connect with API Key</button>
    </form>
  </div>
</body>
</html>`;
}
