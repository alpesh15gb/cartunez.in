import { TransactionBaseService } from "@medusajs/medusa";
import crypto from "crypto";

type Logger = {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
};

type ApexBooksConfig = {
  baseUrl: string;
  apiKey: string;
  webhookSecret: string;
  enabled: boolean;
  timeoutMs: number;
  maxRetries: number;
};

type ApexBooksRequest = {
  method: "GET" | "POST" | "PUT" | "PATCH";
  path: string;
  body?: Record<string, any>;
  idempotencyKey?: string;
};

type SyncResult = {
  status: "ok" | "skipped" | "failed";
  message?: string;
  id?: string;
};

const APEXBOOKS_METADATA_KEY = "apexbooks";

export default class ApexbooksIntegrationService extends TransactionBaseService {
  protected readonly logger_: Logger;
  protected readonly productService_: any;
  protected readonly customerService_: any;
  protected readonly orderService_: any;
  protected readonly config_: ApexBooksConfig;

  constructor(container: any) {
    super(container);
    this.logger_ = container.logger || console;
    this.productService_ = container.productService;
    this.customerService_ = container.customerService;
    this.orderService_ = container.orderService;
    this.config_ = {
      baseUrl: (process.env.APEXBOOKS_BASE_URL || "").replace(/\/$/, ""),
      apiKey: process.env.APEXBOOKS_API_KEY || "",
      webhookSecret: process.env.APEXBOOKS_WEBHOOK_SECRET || "",
      enabled: process.env.APEXBOOKS_ENABLED === "true",
      timeoutMs: Number(process.env.APEXBOOKS_TIMEOUT_MS || 10000),
      maxRetries: Number(process.env.APEXBOOKS_MAX_RETRIES || 3),
    };
  }

  getConfig(): ApexBooksConfig {
    return { ...this.config_, apiKey: this.config_.apiKey ? "***" : "" };
  }

  async sendOutboundEvent(
    eventName: string,
    resourceType: string,
    resourceId: string,
    payload: Record<string, any>
  ): Promise<SyncResult> {
    if (!this.config_.enabled) {
      this.logger_.info(`[ApexBooks] outbound ${eventName} skipped; integration disabled`);
      return { status: "skipped", message: "integration disabled" };
    }

    const idempotencyKey = `${eventName}:${resourceType}:${resourceId}`;
    const body = {
      event: eventName,
      resource_type: resourceType,
      resource_id: resourceId,
      idempotency_key: idempotencyKey,
      occurred_at: new Date().toISOString(),
      data: payload,
    };

    const response = await this.request({
      method: "POST",
      path: "/webhooks/medusa/events",
      body,
      idempotencyKey,
    });

    await this.recordOutboundSync(resourceType, resourceId, eventName, response);
    return { status: "ok", id: idempotencyKey };
  }

  async handleInboundWebhook(payload: Record<string, any>, headers: Record<string, string | string[] | undefined>): Promise<SyncResult> {
    this.verifyWebhook(payload, headers);

    const eventId = this.headerValue(headers["x-apexbooks-event-id"]) || payload.event_id || payload.id;
    const eventType = this.headerValue(headers["x-apexbooks-event-type"]) || payload.event || payload.type;

    if (!eventId || !eventType) {
      throw new Error("Missing ApexBooks webhook event id or type");
    }

    switch (eventType) {
      case "product.changed":
      case "product.created":
      case "product.updated":
        return this.syncProduct(payload.data || payload.product || payload, eventId);
      case "price.updated":
      case "product.price.updated":
        return this.syncPrice(payload.data || payload.price || payload, eventId);
      case "inventory.updated":
      case "product.inventory.updated":
        return this.syncInventory(payload.data || payload.inventory || payload, eventId);
      case "customer.updated":
      case "customer.changed":
        return this.syncCustomer(payload.data || payload.customer || payload, eventId);
      default:
        this.logger_.warn(`[ApexBooks] unsupported inbound event: ${eventType}`);
        return { status: "skipped", message: `unsupported event ${eventType}` };
    }
  }

  async syncProduct(data: Record<string, any>, eventId: string): Promise<SyncResult> {
    const apexbooksId = String(data.apexbooks_id || data.id || "");
    if (!apexbooksId) throw new Error("Product payload missing ApexBooks id");

    const existing = await this.findProductByApexBooksId(apexbooksId);
    if (existing && this.isProcessed(existing.metadata, eventId)) {
      return { status: "skipped", id: existing.id, message: "event already processed" };
    }

    const metadata = this.mergeApexBooksMetadata(existing?.metadata, apexbooksId, eventId, data);
    const productPayload = {
      title: data.title || data.name || existing?.title || "Untitled Product",
      subtitle: data.subtitle || existing?.subtitle,
      description: data.description || existing?.description || "",
      handle: data.handle || existing?.handle || this.slugify(data.title || data.name || apexbooksId),
      thumbnail: data.thumbnail || data.image_url || existing?.thumbnail,
      status: data.status || existing?.status || "published",
      metadata,
    };

    if (existing) {
      const updated = await this.productService_.update(existing.id, productPayload);
      return { status: "ok", id: updated.id };
    }

    const created = await this.productService_.create({
      ...productPayload,
      options: data.options || [{ title: "Default" }],
      variants: data.variants || [
        {
          title: "Default",
          inventory_quantity: Number(data.inventory_quantity || data.inventory || 0),
          prices: this.normalizePrices(data),
          options: [{ value: "Default" }],
        },
      ],
    });

    return { status: "ok", id: created.id };
  }

  async syncPrice(data: Record<string, any>, eventId: string): Promise<SyncResult> {
    const product = await this.requireProduct(data);
    if (this.isProcessed(product.metadata, eventId)) {
      return { status: "skipped", id: product.id, message: "event already processed" };
    }

    const metadata = this.mergeApexBooksMetadata(product.metadata, data.apexbooks_product_id || data.product_id || data.id, eventId, data);
    await this.productService_.update(product.id, { metadata });

    this.logger_.info(`[ApexBooks] price update recorded for product ${product.id}. Variant price mutation is delegated to ERP import workflow.`);
    return { status: "ok", id: product.id };
  }

  async syncInventory(data: Record<string, any>, eventId: string): Promise<SyncResult> {
    const product = await this.requireProduct(data);
    if (this.isProcessed(product.metadata, eventId)) {
      return { status: "skipped", id: product.id, message: "event already processed" };
    }

    const quantity = Number(data.inventory_quantity ?? data.quantity ?? data.stock ?? 0);
    if (Array.isArray(product.variants)) {
      for (const variant of product.variants) {
        await this.productService_.updateVariant(product.id, variant.id, {
          inventory_quantity: quantity,
          metadata: this.mergeApexBooksMetadata(variant.metadata, data.apexbooks_variant_id || data.variant_id || variant.id, eventId, data),
        });
      }
    }

    await this.productService_.update(product.id, {
      metadata: this.mergeApexBooksMetadata(product.metadata, data.apexbooks_product_id || data.product_id || data.id, eventId, data),
    });

    return { status: "ok", id: product.id };
  }

  async syncCustomer(data: Record<string, any>, eventId: string): Promise<SyncResult> {
    const apexbooksId = String(data.apexbooks_id || data.id || "");
    if (!apexbooksId) throw new Error("Customer payload missing ApexBooks id");

    const existing = await this.findCustomerByApexBooksId(apexbooksId, data.email);
    if (existing && this.isProcessed(existing.metadata, eventId)) {
      return { status: "skipped", id: existing.id, message: "event already processed" };
    }

    const metadata = this.mergeApexBooksMetadata(existing?.metadata, apexbooksId, eventId, data);
    const customerPayload = {
      email: data.email || existing?.email,
      first_name: data.first_name || data.firstName || existing?.first_name,
      last_name: data.last_name || data.lastName || existing?.last_name,
      phone: data.phone || existing?.phone,
      metadata,
    };

    if (!customerPayload.email) throw new Error("Customer payload missing email");

    if (existing) {
      const updated = await this.customerService_.update(existing.id, customerPayload);
      return { status: "ok", id: updated.id };
    }

    const created = await this.customerService_.create(customerPayload);
    return { status: "ok", id: created.id };
  }

  verifyWebhook(payload: Record<string, any>, headers: Record<string, string | string[] | undefined>): void {
    if (!this.config_.webhookSecret) {
      throw new Error("APEXBOOKS_WEBHOOK_SECRET is not configured");
    }

    const timestamp = this.headerValue(headers["x-apexbooks-timestamp"]);
    const signature = this.headerValue(headers["x-apexbooks-signature"]);
    if (!timestamp || !signature) {
      throw new Error("Missing ApexBooks webhook signature headers");
    }

    const body = JSON.stringify(payload);
    const expected = crypto
      .createHmac("sha256", this.config_.webhookSecret)
      .update(`${timestamp}.${body}`)
      .digest("hex");

    const normalized = signature.replace(/^sha256=/, "");
    if (expected.length !== normalized.length) {
      throw new Error("Invalid ApexBooks webhook signature");
    }

    const valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(normalized));
    if (!valid) {
      throw new Error("Invalid ApexBooks webhook signature");
    }
  }

  private async request(request: ApexBooksRequest): Promise<Record<string, any>> {
    if (!this.config_.baseUrl || !this.config_.apiKey) {
      throw new Error("ApexBooks base URL/API key is not configured");
    }

    let attempt = 0;
    let lastError: any;
    while (attempt < this.config_.maxRetries) {
      attempt += 1;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config_.timeoutMs);
      const url = `${this.config_.baseUrl}${request.path}`;

      this.logger_.info(`[ApexBooks] request ${request.method} ${url} attempt=${attempt} idempotency=${request.idempotencyKey || ""}`);

      try {
        const response = await fetch(url, {
          method: request.method,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.config_.apiKey}`,
            ...(request.idempotencyKey ? { "Idempotency-Key": request.idempotencyKey } : {}),
          },
          body: request.body ? JSON.stringify(request.body) : undefined,
        });
        const text = await response.text();
        const parsed = text ? this.safeJson(text) : {};

        this.logger_.info(`[ApexBooks] response ${request.method} ${url} status=${response.status} body=${this.truncate(text)}`);

        if (response.ok) return parsed;
        if (response.status < 500 && response.status !== 429) {
          throw new Error(`ApexBooks request failed ${response.status}: ${text}`);
        }
        lastError = new Error(`ApexBooks retryable failure ${response.status}: ${text}`);
      } catch (error) {
        lastError = error;
        this.logger_.error(`[ApexBooks] request error ${request.method} ${url} attempt=${attempt}`, error);
      } finally {
        clearTimeout(timeout);
      }

      if (attempt < this.config_.maxRetries) {
        await this.sleep(250 * Math.pow(2, attempt - 1));
      }
    }

    throw lastError;
  }

  private async recordOutboundSync(resourceType: string, resourceId: string, eventName: string, response: Record<string, any>): Promise<void> {
    if (resourceType === "order") {
      const order = await this.orderService_.retrieve(resourceId);
      const metadata = this.mergeSyncMetadata(order.metadata, eventName, response);
      await this.orderService_.update(resourceId, { metadata });
    }
  }

  private async requireProduct(data: Record<string, any>): Promise<any> {
    const apexbooksId = data.apexbooks_product_id || data.product_id || data.apexbooks_id || data.id;
    const product = await this.findProductByApexBooksId(String(apexbooksId));
    if (!product) throw new Error(`Product not found for ApexBooks id ${apexbooksId}`);
    return this.productService_.retrieve(product.id, { relations: ["variants"] });
  }

  private async findProductByApexBooksId(apexbooksId: string): Promise<any | null> {
    const products = await this.productService_.list({}, { take: 10000 });
    return products.find((product: any) => product.metadata?.[APEXBOOKS_METADATA_KEY]?.id === apexbooksId) || null;
  }

  private async findCustomerByApexBooksId(apexbooksId: string, email?: string): Promise<any | null> {
    const customers = await this.customerService_.list({}, { take: 10000 });
    return customers.find((customer: any) => customer.metadata?.[APEXBOOKS_METADATA_KEY]?.id === apexbooksId)
      || (email ? customers.find((customer: any) => customer.email === email) : null)
      || null;
  }

  private mergeApexBooksMetadata(current: Record<string, any> | null | undefined, apexbooksId: string, eventId: string, payload: Record<string, any>): Record<string, any> {
    const metadata = { ...(current || {}) };
    const currentApex = metadata[APEXBOOKS_METADATA_KEY] || {};
    const processed = Array.isArray(currentApex.processed_event_ids) ? currentApex.processed_event_ids : [];

    metadata[APEXBOOKS_METADATA_KEY] = {
      ...currentApex,
      id: apexbooksId,
      last_event_id: eventId,
      last_synced_at: new Date().toISOString(),
      processed_event_ids: Array.from(new Set([...processed.slice(-49), eventId])),
      last_payload_hash: this.hash(payload),
    };

    return metadata;
  }

  private mergeSyncMetadata(current: Record<string, any> | null | undefined, eventName: string, response: Record<string, any>): Record<string, any> {
    const metadata = { ...(current || {}) };
    const currentApex = metadata[APEXBOOKS_METADATA_KEY] || {};
    metadata[APEXBOOKS_METADATA_KEY] = {
      ...currentApex,
      outbound: {
        ...(currentApex.outbound || {}),
        [eventName]: {
          status: "sent",
          sent_at: new Date().toISOString(),
          response_id: response.id || response.event_id || null,
        },
      },
    };
    return metadata;
  }

  private isProcessed(metadata: Record<string, any> | null | undefined, eventId: string): boolean {
    const processed = metadata?.[APEXBOOKS_METADATA_KEY]?.processed_event_ids;
    return Array.isArray(processed) && processed.includes(eventId);
  }

  private normalizePrices(data: Record<string, any>): Array<Record<string, any>> {
    if (Array.isArray(data.prices)) return data.prices;
    return [{
      currency_code: (data.currency_code || "inr").toLowerCase(),
      amount: Number(data.amount || data.price || 0),
    }];
  }

  private safeJson(text: string): Record<string, any> {
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }

  private headerValue(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }

  private slugify(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  private hash(value: Record<string, any>): string {
    return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
  }

  private truncate(value: string): string {
    return value.length > 2000 ? `${value.slice(0, 2000)}...` : value;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
