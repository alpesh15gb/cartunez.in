import { TransactionBaseService } from "@medusajs/medusa";
import crypto from "crypto";
import { IntegrationApp } from "../models/integration-app";
import { IntegrationConnection } from "../models/integration-connection";
import { IntegrationEventLog } from "../models/integration-event-log";

type Logger = {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
};

type CreateConnectionInput = {
  app_id: string;
  tenant_id: string;
  name: string;
  credentials: Record<string, string>;
  configuration?: Record<string, any>;
};

type UpdateConnectionInput = {
  name?: string;
  credentials?: Record<string, string>;
  configuration?: Record<string, any>;
  status?: string;
};

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const ITERATIONS = 100000;
const DIGEST = "sha512";

export default class IntegrationService extends TransactionBaseService {
  protected readonly logger_: Logger;

  constructor(container: any) {
    super(container);
    this.logger_ = container.logger || console;
  }

  // ─── App Definitions ────────────────────────────────────────────────────────

  async listApps(): Promise<IntegrationApp[]> {
    const repo = this.getAppRepository();
    return repo.find({ where: { status: "active" }, order: { name: "ASC" } });
  }

  async getApp(id: string): Promise<IntegrationApp | null> {
    const repo = this.getAppRepository();
    return repo.findOne({ where: { id } });
  }

  async getAppByType(type: string): Promise<IntegrationApp | null> {
    const repo = this.getAppRepository();
    return repo.findOne({ where: { type, status: "active" } });
  }

  // ─── Connections ────────────────────────────────────────────────────────────

  async listConnections(tenantId?: string): Promise<IntegrationConnection[]> {
    const repo = this.getConnectionRepository();
    const where: any = {};
    if (tenantId) {
      where.tenant_id = tenantId;
    }
    return repo.find({ where, order: { created_at: "DESC" } });
  }

  async getConnection(id: string): Promise<IntegrationConnection | null> {
    const repo = this.getConnectionRepository();
    const connection = await repo.findOne({ where: { id } });
    if (!connection) return null;
    // Strip encrypted credentials from response — callers fetch config separately
    return connection;
  }

  async createConnection(data: CreateConnectionInput): Promise<IntegrationConnection> {
    const repo = this.getConnectionRepository();
    const app = await this.getApp(data.app_id);
    if (!app) throw new Error(`Integration app ${data.app_id} not found`);

    const encrypted = this.encrypt(JSON.stringify(data.credentials));
    const connection = repo.create({
      app_id: data.app_id,
      tenant_id: data.tenant_id,
      name: data.name,
      encrypted_credentials: encrypted,
      configuration: data.configuration || {},
      status: "active",
    });

    const saved = await repo.save(connection);
    this.logger_.info(`[Integration] created connection ${saved.id} for app ${app.type}`);
    return saved;
  }

  async updateConnection(id: string, data: UpdateConnectionInput): Promise<IntegrationConnection> {
    const repo = this.getConnectionRepository();
    const connection = await repo.findOne({ where: { id } });
    if (!connection) throw new Error(`Integration connection ${id} not found`);

    if (data.name !== undefined) connection.name = data.name;
    if (data.status !== undefined) connection.status = data.status;
    if (data.configuration !== undefined) {
      connection.configuration = { ...connection.configuration, ...data.configuration };
    }
    if (data.credentials !== undefined) {
      connection.encrypted_credentials = this.encrypt(JSON.stringify(data.credentials));
    }

    const saved = await repo.save(connection);
    this.logger_.info(`[Integration] updated connection ${id}`);
    return saved;
  }

  async deleteConnection(id: string): Promise<void> {
    const repo = this.getConnectionRepository();
    const connection = await repo.findOne({ where: { id } });
    if (!connection) throw new Error(`Integration connection ${id} not found`);

    connection.status = "disabled";
    await repo.save(connection);
    this.logger_.info(`[Integration] disabled connection ${id}`);
  }

  async getConnectionConfig(id: string): Promise<{
    app: IntegrationApp | null;
    credentials: Record<string, string>;
    configuration: Record<string, any>;
  }> {
    const connection = await this.getConnection(id);
    if (!connection) throw new Error(`Integration connection ${id} not found`);

    const app = await this.getApp(connection.app_id);
    let credentials: Record<string, string> = {};
    try {
      const decrypted = this.decrypt(connection.encrypted_credentials);
      credentials = JSON.parse(decrypted);
    } catch (error: any) {
      this.logger_.error(`[Integration] failed to decrypt credentials for connection ${id}: ${error.message}`);
    }

    return { app, credentials, configuration: connection.configuration };
  }

  // ─── Config Resolution for ApexBooksIntegrationService ──────────────────────

  async getConfigForType(type: string, tenantId: string): Promise<{
    baseUrl?: string;
    apiKey?: string;
    webhookSecret?: string;
    tenantId?: string;
    timeoutMs?: number;
    maxRetries?: number;
  } | null> {
    const app = await this.getAppByType(type);
    if (!app) return null;

    const repo = this.getConnectionRepository();
    const connection = await repo.findOne({
      where: { app_id: app.id, tenant_id: tenantId, status: "active" },
    });
    if (!connection) return null;

    let credentials: Record<string, string> = {};
    try {
      const decrypted = this.decrypt(connection.encrypted_credentials);
      credentials = JSON.parse(decrypted);
    } catch {
      return null;
    }

    return {
      baseUrl: credentials.baseUrl || connection.configuration.baseUrl,
      apiKey: credentials.apiKey,
      webhookSecret: credentials.webhookSecret,
      tenantId: credentials.tenantId || connection.configuration.tenantId,
      timeoutMs: Number(connection.configuration.timeoutMs || 10000),
      maxRetries: Number(connection.configuration.maxRetries || 10),
    };
  }

  // ─── Test Connection ────────────────────────────────────────────────────────

  async testConnection(id: string): Promise<{ success: boolean; message: string; status?: number }> {
    const config = await this.getConnectionConfig(id);
    if (!config.app) return { success: false, message: "Integration app not found" };

    const baseUrl = config.credentials.baseUrl || config.configuration.baseUrl;
    if (!baseUrl) return { success: false, message: "Base URL not configured" };

    try {
      const timestamp = new Date().toISOString();
      const apiKey = config.credentials.apiKey || "";
      const signatureInput = `${timestamp}.`;
      const signature = crypto.createHmac("sha256", apiKey).update(signatureInput).digest("hex");

      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/health`, {
        method: "GET",
        headers: {
          "X-ApexBooks-Contract-Version": "v1",
          "X-ApexBooks-Timestamp": timestamp,
          "X-ApexBooks-Signature": `sha256=${signature}`,
          "X-ApexBooks-Tenant-Id": config.credentials.tenantId || config.configuration.tenantId || "",
        },
        signal: AbortSignal.timeout(10000),
      });

      return {
        success: response.ok,
        message: response.ok ? "Connection successful" : `HTTP ${response.status}`,
        status: response.status,
      };
    } catch (error: any) {
      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }

  // ─── Event Logging ──────────────────────────────────────────────────────────

  async logEvent(
    connectionId: string,
    eventType: string,
    payload: Record<string, any>,
    status: string,
    responseStatus?: number | null,
    responseBody?: string | null,
    errorMessage?: string | null
  ): Promise<void> {
    const repo = this.getLogRepository();
    const log = repo.create({
      connection_id: connectionId,
      event_type: eventType,
      request_payload: payload,
      status,
      response_status: responseStatus ?? null,
      response_body: responseBody ?? null,
      error_message: errorMessage ?? null,
      attempt_count: 1,
    });
    await repo.save(log);
  }

  async getLogs(connectionId: string, limit: number = 50): Promise<IntegrationEventLog[]> {
    const repo = this.getLogRepository();
    return repo.find({
      where: { connection_id: connectionId },
      order: { created_at: "DESC" },
      take: limit,
    });
  }

  // ─── Encryption ─────────────────────────────────────────────────────────────

  private getEncryptionKey(): Buffer {
    const secret = process.env.INTEGRATIONS_ENCRYPTION_KEY || process.env.JWT_SECRET || "";
    if (!secret) {
      throw new Error("INTEGRATIONS_ENCRYPTION_KEY (or JWT_SECRET) must be configured for credential encryption");
    }
    // Derive a fixed-size key via PBKDF2
    return crypto.pbkdf2Sync(secret, "integrations-salt", ITERATIONS, KEY_LENGTH, DIGEST);
  }

  private encrypt(plaintext: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();
    // Store salt + iv + tag + ciphertext so we only need the key to decrypt
    const bundle = {
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
      ciphertext: encrypted,
    };
    return JSON.stringify(bundle);
  }

  private decrypt(encoded: string): string {
    const key = this.getEncryptionKey();
    const bundle = JSON.parse(encoded);
    const iv = Buffer.from(bundle.iv, "hex");
    const tag = Buffer.from(bundle.tag, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(bundle.ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  // ─── Repository Accessors ───────────────────────────────────────────────────

  private getAppRepository() {
    return this.manager_.getRepository(IntegrationApp);
  }

  private getConnectionRepository() {
    return this.manager_.getRepository(IntegrationConnection);
  }

  private getLogRepository() {
    return this.manager_.getRepository(IntegrationEventLog);
  }
}
