import { Router } from "express";
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import authenticate from "@medusajs/medusa/dist/api/middlewares/authenticate";
import IntegrationService from "../../../services/integration-service";

export default () => {
  const router = Router();

  // All integration admin routes require authentication
  router.use(authenticate());

  // ─── App Definitions ────────────────────────────────────────────────────

  router.get("/admin/integrations/apps", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      const apps = await service.listApps();
      res.json({ apps });
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] list apps failed", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Connections ───────────────────────────────────────────────────────

  router.get("/admin/integrations", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      const tenantId = req.query.tenant_id as string | undefined;
      const connections = await service.listConnections(tenantId);
      res.json({ connections });
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] list connections failed", error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/admin/integrations", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      const connection = await service.createConnection(req.body);
      res.status(201).json({ connection });
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] create connection failed", error);
      res.status(400).json({ error: error.message });
    }
  });

  router.get("/admin/integrations/:id", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      const connection = await service.getConnection(req.params.id);
      if (!connection) return res.status(404).json({ error: "Connection not found" });
      return res.json({ connection });
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] get connection failed", error);
      return res.status(500).json({ error: error.message });
    }
  });

  router.put("/admin/integrations/:id", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      const connection = await service.updateConnection(req.params.id, req.body);
      res.json({ connection });
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] update connection failed", error);
      res.status(400).json({ error: error.message });
    }
  });

  router.delete("/admin/integrations/:id", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      await service.deleteConnection(req.params.id);
      res.json({ status: "ok" });
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] delete connection failed", error);
      res.status(400).json({ error: error.message });
    }
  });

  router.post("/admin/integrations/:id/test", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      const result = await service.testConnection(req.params.id);
      res.json(result);
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] test connection failed", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Event Logs ────────────────────────────────────────────────────────

  router.get("/admin/integrations/:id/logs", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      const limit = Number(req.query.limit) || 50;
      const logs = await service.getLogs(req.params.id, limit);
      res.json({ logs });
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] get logs failed", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Non-secret Config ─────────────────────────────────────────────────

  router.get("/admin/integrations/:id/config", async (req: MedusaRequest, res: MedusaResponse) => {
    try {
      const service = req.scope.resolve("integrationService") as IntegrationService;
      const config = await service.getConnectionConfig(req.params.id);
      if (!config.app) return res.status(404).json({ error: "Connection not found" });
      // Only return non-secret configuration
      return res.json({
        app: { id: config.app.id, name: config.app.name, type: config.app.type },
        configuration: config.configuration,
      });
    } catch (error: any) {
      req.scope.resolve("logger").error("[Integrations] get config failed", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // ─── Admin UI ─────────────────────────────────────────────────────────

  router.get("/admin/integrations/ui", (_req: MedusaRequest, res: MedusaResponse) => {
    res.setHeader("Content-Type", "text/html");
    res.send(UI_HTML);
  });

  router.get("/admin/integrations/ui/app.js", (_req: MedusaRequest, res: MedusaResponse) => {
    res.setHeader("Content-Type", "application/javascript");
    res.send(UI_JS);
  });

  return router;
};

const UI_CSS = `
:root {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-card: #1e2746;
  --bg-input: #253053;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0b0;
  --accent: #7c5cfc;
  --accent-hover: #6a4de6;
  --success: #4caf50;
  --warning: #ff9800;
  --danger: #f44336;
  --border: #2d3a5c;
  --border-focus: #7c5cfc;
  --radius: 8px;
  --shadow: 0 2px 8px rgba(0,0,0,0.3);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 24px;
  min-height: 100vh;
}
.header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.header h1 { font-size: 24px; font-weight: 600; }
.header h1 span { color: var(--accent); }
button {
  background: var(--accent); color: white; border: none;
  padding: 8px 20px; border-radius: var(--radius);
  cursor: pointer; font-size: 14px; font-weight: 500;
  transition: background 0.2s;
}
button:hover { background: var(--accent-hover); }
button.secondary { background: var(--bg-input); border: 1px solid var(--border); }
button.secondary:hover { background: var(--border); }
button.danger { background: var(--danger); }
button.danger:hover { background: #d32f2f; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
.card {
  background: var(--bg-card); border-radius: var(--radius);
  padding: 20px; border: 1px solid var(--border); box-shadow: var(--shadow);
}
.card h3 { font-size: 16px; margin-bottom: 8px; }
.card .meta { font-size: 12px; color: var(--text-secondary); margin-bottom: 12px; }
.badge {
  display: inline-block; padding: 2px 8px; border-radius: 12px;
  font-size: 11px; font-weight: 600; text-transform: uppercase;
}
.badge.active { background: rgba(76,175,80,0.2); color: var(--success); }
.badge.disabled { background: rgba(244,67,54,0.2); color: var(--danger); }
.empty { text-align: center; padding: 40px; color: var(--text-secondary); }
.modal-overlay {
  display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6); align-items: center; justify-content: center; z-index: 1000;
}
.modal-overlay.open { display: flex; }
.modal {
  background: var(--bg-secondary); border-radius: var(--radius);
  padding: 24px; width: 90%; max-width: 560px; max-height: 90vh;
  overflow-y: auto; border: 1px solid var(--border);
}
.modal h2 { margin-bottom: 20px; font-size: 18px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
.form-group input, .form-group select {
  width: 100%; padding: 8px 12px; background: var(--bg-input);
  border: 1px solid var(--border); border-radius: var(--radius);
  color: var(--text-primary); font-size: 14px;
}
.form-group input:focus, .form-group select:focus {
  outline: none; border-color: var(--border-focus);
}
.form-group input::placeholder { color: #555; }
.form-row { display: flex; gap: 12px; }
.form-row .form-group { flex: 1; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 24px; }
.spinner {
  display: inline-block; width: 16px; height: 16px;
  border: 2px solid var(--border); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.alert {
  padding: 10px 14px; border-radius: var(--radius); margin-bottom: 16px;
  font-size: 13px;
}
.alert.success { background: rgba(76,175,80,0.15); color: var(--success); border: 1px solid rgba(76,175,80,0.3); }
.alert.error { background: rgba(244,67,54,0.15); color: var(--danger); border: 1px solid rgba(244,67,54,0.3); }
.alert.info { background: rgba(124,92,252,0.15); color: var(--accent); border: 1px solid rgba(124,92,252,0.3); }
.detail-row { display: flex; margin-bottom: 8px; }
.detail-row .label { width: 140px; font-size: 13px; color: var(--text-secondary); flex-shrink: 0; }
.detail-row .value { font-size: 13px; word-break: break-all; }
.log-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
.log-table th { text-align: left; padding: 8px 12px; color: var(--text-secondary); border-bottom: 1px solid var(--border); font-weight: 500; }
.log-table td { padding: 8px 12px; border-bottom: 1px solid var(--border); }
.log-table tr:hover { background: rgba(124,92,252,0.05); }
`;

const UI_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Integrations - Cartunez</title>
<style>${UI_CSS}</style>
</head>
<body>
<div class="header">
  <h1><span>Integrations</span> Management</h1>
  <div>
    <button id="refreshBtn" class="secondary">Refresh</button>
    <button id="addBtn">+ Add Integration</button>
  </div>
</div>
<div id="alertContainer"></div>
<div id="mainContent">
  <div class="spinner" style="margin:40px auto"></div>
</div>

<div class="modal-overlay" id="modal">
  <div class="modal">
    <h2 id="modalTitle">Add Integration</h2>
    <div id="modalBody"></div>
  </div>
</div>

<div class="modal-overlay" id="detailModal">
  <div class="modal" style="max-width: 700px;">
    <h2 id="detailTitle">Connection Details</h2>
    <div id="detailBody"></div>
  </div>
</div>

<script src="/admin/integrations/ui/app.js"></script>
</body>
</html>`;

const UI_JS = `
async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && !opts.suppressError) {
    showAlert(data.error || 'Request failed', 'error');
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

function showAlert(msg, type = 'info') {
  const c = document.getElementById('alertContainer');
  const a = document.createElement('div');
  a.className = 'alert ' + type;
  a.textContent = msg;
  c.appendChild(a);
  setTimeout(() => a.remove(), 5000);
}

let apps = [];
let connections = [];

async function loadApps() {
  const data = await api('/admin/integrations/apps');
  apps = data.apps || [];
}

async function loadConnections() {
  const data = await api('/admin/integrations');
  connections = data.connections || [];
}

function render() {
  const el = document.getElementById('mainContent');
  if (connections.length === 0) {
    el.innerHTML = '<div class="empty"><p>No integrations configured yet.</p><button onclick="openAddModal()" style="margin-top:12px">+ Add Your First Integration</button></div>';
    return;
  }
  let html = '<div class="cards">';
  for (const conn of connections) {
    const app = apps.find(a => a.id === conn.app_id);
    html += \`
      <div class="card" onclick="openDetail('\${conn.id}')" style="cursor:pointer">
        <h3>\${app ? app.name : conn.name}</h3>
        <div class="meta">\${conn.name} · \${conn.tenant_id}</div>
        <div><span class="badge \${conn.status}">\${conn.status}</span></div>
      </div>
    \`;
  }
  html += '</div>';
  el.innerHTML = html;
}

function openAddModal() {
  document.getElementById('modalTitle').textContent = 'Add Integration';
  let appOpts = apps.map(a => \`<option value="\${a.id}">\${a.name}</option>\`).join('');
  document.getElementById('modalBody').innerHTML = \`
    <div class="form-group">
      <label>App Type</label>
      <select id="formApp">\${appOpts}</select>
    </div>
    <div class="form-group">
      <label>Connection Name</label>
      <input id="formName" placeholder="My ApexBooks Integration" />
    </div>
    <div class="form-group">
      <label>Tenant ID</label>
      <input id="formTenant" placeholder="your-tenant-id" />
    </div>
    <div class="form-group">
      <label>API Base URL</label>
      <input id="formBaseUrl" placeholder="https://api.apexbooks.in" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>API Key</label>
        <input id="formApiKey" type="password" placeholder="API key" />
      </div>
      <div class="form-group">
        <label>Webhook Secret</label>
        <input id="formWebhookSecret" type="password" placeholder="Webhook secret" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Timeout (ms)</label>
        <input id="formTimeout" type="number" value="10000" />
      </div>
      <div class="form-group">
        <label>Max Retries</label>
        <input id="formRetries" type="number" value="10" />
      </div>
    </div>
    <div id="testResult"></div>
    <div class="modal-actions">
      <button class="secondary" onclick="closeModal()">Cancel</button>
      <button onclick="testConnection()" id="testBtn">Test Connection</button>
      <button onclick="saveConnection()" id="saveBtn" disabled>Save</button>
    </div>
  \`;
  document.getElementById('modal').classList.add('open');
}

async function testConnection() {
  const btn = document.getElementById('testBtn');
  const result = document.getElementById('testResult');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Testing...';
  try {
    saveConnection(true).then(async (connId) => {
      if (connId) {
        const data = await api(\`/admin/integrations/\${connId}/test\`);
        result.innerHTML = data.success
          ? '<div class="alert success">Success (status ' + data.status + ')</div>'
          : '<div class="alert error">Failed: ' + data.message + '</div>';
        await api(\`/admin/integrations/\${connId}\`, { method: 'DELETE', suppressError: true });
      }
      btn.disabled = false; btn.textContent = 'Test Connection';
    }).catch(e => {
      result.innerHTML = '<div class="alert error">Failed: ' + e.message + '</div>';
      btn.disabled = false; btn.textContent = 'Test Connection';
    });
  } catch(e) {
    result.innerHTML = '<div class="alert error">Failed: ' + e.message + '</div>';
    btn.disabled = false; btn.textContent = 'Test Connection';
  }
}

async function saveConnection(isTest = false) {
  const appId = document.getElementById('formApp').value;
  const name = document.getElementById('formName').value;
  const tenant = document.getElementById('formTenant').value;
  const baseUrl = document.getElementById('formBaseUrl').value;
  const apiKey = document.getElementById('formApiKey').value;
  const webhookSecret = document.getElementById('formWebhookSecret').value;
  const timeoutMs = parseInt(document.getElementById('formTimeout').value) || 10000;
  const maxRetries = parseInt(document.getElementById('formRetries').value) || 10;

  if (!name || !tenant || !baseUrl) {
    showAlert('Name, Tenant ID, and Base URL are required', 'error');
    if (!isTest) return;
    return null;
  }

  try {
    const data = await api('/admin/integrations', {
      method: 'POST',
      body: JSON.stringify({
        app_id: appId,
        tenant_id: tenant,
        name,
        credentials: { baseUrl, apiKey, webhookSecret, tenantId: tenant },
        configuration: { baseUrl, tenantId: tenant, timeoutMs, maxRetries },
      }),
    });

    if (isTest) return data.connection.id;

    showAlert('Integration created successfully', 'success');
    closeModal();
    await refresh();
  } catch(e) {
    if (!isTest) showAlert(e.message, 'error');
    return null;
  }
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.getElementById('detailModal').classList.remove('open');
}

async function openDetail(id) {
  const [connData, configData, logsData] = await Promise.all([
    api('/admin/integrations/' + id),
    api('/admin/integrations/' + id + '/config'),
    api('/admin/integrations/' + id + '/logs?limit=20'),
  ]);
  const conn = connData.connection;
  const app = apps.find(a => a.id === conn.app_id);
  const config = configData;
  const logs = logsData.logs || [];

  document.getElementById('detailTitle').textContent = app ? app.name + ' — ' + conn.name : conn.name;
  document.getElementById('detailBody').innerHTML = \`
    <div class="detail-row"><span class="label">Status</span><span class="value"><span class="badge \${conn.status}">\${conn.status}</span></span></div>
    <div class="detail-row"><span class="label">Tenant ID</span><span class="value">\${conn.tenant_id}</span></div>
    <div class="detail-row"><span class="label">Base URL</span><span class="value">\${config.configuration?.baseUrl || '-'}</span></div>
    <div class="detail-row"><span class="label">Timeout</span><span class="value">\${config.configuration?.timeoutMs || '-'} ms</span></div>
    <div class="detail-row"><span class="label">Max Retries</span><span class="value">\${config.configuration?.maxRetries || '-'}</span></div>
    <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
      <button onclick="testExisting('\${id}')" id="testExistingBtn">Test Connection</button>
      <button class="secondary" onclick="disableConnection('\${id}')">\${conn.status === 'active' ? 'Disable' : 'Enable'}</button>
      <button class="danger" onclick="deleteConnection('\${id}')">Delete</button>
    </div>
    <div id="testResultDetail"></div>

    <h3 style="margin-top:24px;font-size:15px;margin-bottom:8px">Event Log</h3>
    \${logs.length === 0 ? '<p class="empty" style="padding:16px">No events logged yet.</p>' : \`
    <table class="log-table">
      <thead><tr><th>Event Type</th><th>Status</th><th>Response</th><th>Time</th></tr></thead>
      <tbody>
        \${logs.map(l => \`<tr><td>\${l.event_type}</td><td><span class="badge \${l.status}\">\${l.status}</span></td><td>\${l.response_status || '-'}</td><td style="font-size:11px;color:var(--text-secondary)">\${new Date(l.created_at).toLocaleString()}</td></tr>\`).join('')}
      </tbody>
    </table>\`}
  \`;
  document.getElementById('detailModal').classList.add('open');
}

async function testExisting(id) {
  const btn = document.getElementById('testExistingBtn');
  const result = document.getElementById('testResultDetail');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Testing...';
  try {
    const data = await api('/admin/integrations/' + id + '/test');
    result.innerHTML = data.success
      ? '<div class="alert success">Success (status ' + data.status + ')</div>'
      : '<div class="alert error">Failed: ' + data.message + '</div>';
  } catch(e) {
    result.innerHTML = '<div class="alert error">Failed: ' + e.message + '</div>';
  }
  btn.disabled = false; btn.textContent = 'Test Connection';
}

async function disableConnection(id) {
  const conn = connections.find(c => c.id === id);
  const newStatus = conn.status === 'active' ? 'disabled' : 'active';
  try {
    await api('/admin/integrations/' + id, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
    showAlert('Connection ' + newStatus, 'success');
    closeModal();
    await refresh();
  } catch(e) {
    showAlert(e.message, 'error');
  }
}

async function deleteConnection(id) {
  if (!confirm('Permanently disable this integration connection?')) return;
  try {
    await api('/admin/integrations/' + id, { method: 'DELETE' });
    showAlert('Connection disabled', 'success');
    closeModal();
    await refresh();
  } catch(e) {
    showAlert(e.message, 'error');
  }
}

async function refresh() {
  await Promise.all([loadApps(), loadConnections()]);
  render();
}

document.getElementById('refreshBtn').addEventListener('click', refresh);
document.getElementById('addBtn').addEventListener('click', openAddModal);
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) closeModal();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

refresh();
`;
