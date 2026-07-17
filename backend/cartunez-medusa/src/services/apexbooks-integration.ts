import { TransactionBaseService } from "@medusajs/medusa";
import crypto from "crypto";
import { IsNull, LessThanOrEqual } from "typeorm";
import ApexBooksEventBuilder, {
  APEXBOOKS_CONTRACT_VERSION,
  APEXBOOKS_CONTRACT_VERSION_HEADER,
} from "./apexbooks-event-builder";
import { ApexBooksOutboundEvent } from "../models/apexbooks-outbound-event";
import { ApexBooksEntityMapping } from "../models/apexbooks-entity-mapping";

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
  tenantId: string;
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
  queue_id?: string;
};

const APEXBOOKS_METADATA_KEY = "apexbooks";
const HMAC_MAX_AGE_MS = 300_000; // 5 minutes
const HMAC_CLOCK_SKEW_MS = 60_000; // 1 minute
const QUEUE_BATCH_SIZE = 10;

class ApexBooksRequestError extends Error {
  retryable: boolean;
  status: number;
  constructor(message: string, retryable: boolean, status: number) {
    super(message);
    this.retryable = retryable;
    this.status = status;
  }
}

export default class ApexbooksIntegrationService extends TransactionBaseService {
  protected readonly logger_: Logger;
  protected readonly productService_: any;
  protected readonly customerService_: any;
  protected readonly orderService_: any;
  protected readonly paymentService_: any;
  protected readonly returnService_: any;
  protected readonly config_: ApexBooksConfig;
  protected readonly eventBuilder_: ApexBooksEventBuilder;
  private readonly processedOutboundKeys_: Set<string>;
  private integrationService_: any;
  private dbConfigLoaded_: boolean;

  constructor(container: any) {
    super(container);
    this.logger_ = container.logger || console;
    this.productService_ = container.productService;
    this.customerService_ = container.customerService;
    this.orderService_ = container.orderService;
    this.paymentService_ = container.paymentService;
    this.returnService_ = container.returnService;
    this.eventBuilder_ = new ApexBooksEventBuilder();
    this.processedOutboundKeys_ = new Set();
    this.integrationService_ = container.integrationService;
    this.dbConfigLoaded_ = false;
    this.config_ = this.loadBaseConfig();
  }

  private loadBaseConfig(): ApexBooksConfig {
    return {
      baseUrl: (process.env.APEXBOOKS_BASE_URL || "").replace(/\/$/, ""),
      apiKey: process.env.APEXBOOKS_API_KEY || "",
      webhookSecret: process.env.APEXBOOKS_WEBHOOK_SECRET || "",
      enabled: process.env.APEXBOOKS_ENABLED === "true",
      timeoutMs: Number(process.env.APEXBOOKS_TIMEOUT_MS || 10000),
      maxRetries: Number(process.env.APEXBOOKS_MAX_RETRIES || 3),
      tenantId: process.env.APEXBOOKS_TENANT_ID || "",
    };
  }

  private async loadConfigFromDb(): Promise<void> {
    if (this.dbConfigLoaded_) return;
    this.dbConfigLoaded_ = true;

    // Resolve IntegrationService lazily — it may not be available at construct time
    if (!this.integrationService_ || !this.config_.tenantId) return;

    try {
      const dbConfig = await this.integrationService_.getConfigForType("apexbooks", this.config_.tenantId);
      if (!dbConfig) return; // No DB config found, continue with env-only

      // Merge: DB takes precedence over env vars for these fields
      if (dbConfig.baseUrl) this.config_.baseUrl = dbConfig.baseUrl.replace(/\/$/, "");
      if (dbConfig.apiKey) this.config_.apiKey = dbConfig.apiKey;
      if (dbConfig.webhookSecret) this.config_.webhookSecret = dbConfig.webhookSecret;
      if (dbConfig.tenantId) this.config_.tenantId = dbConfig.tenantId;
      if (dbConfig.timeoutMs) this.config_.timeoutMs = dbConfig.timeoutMs;
      if (dbConfig.maxRetries) this.config_.maxRetries = dbConfig.maxRetries;

      this.logger_.info("[ApexBooks] configuration loaded from DB integration_connection");
    } catch (error: any) {
      this.logger_.warn(`[ApexBooks] failed to load DB config, falling back to env vars: ${error.message}`);
    }
  }

  getConfig(): ApexBooksConfig {
    return { ...this.config_, apiKey: "***", webhookSecret: "***" };
  }

  async sendOutboundEvent(
    eventName: string,
    resourceType: string,
    resourceId: string,
    payload: Record<string, any>
  ): Promise<SyncResult> {
    await this.loadConfigFromDb();
    if (!this.config_.enabled) {
      this.logger_.info(`[ApexBooks] outbound ${eventName} skipped; integration disabled`);
      return { status: "skipped", message: "integration disabled" };
    }

    // Tenant context enforcement
    const tenantId = this.resolveTenant();
    if (!tenantId) {
      throw new Error("ApexBooks tenant context cannot be resolved; rejecting outbound event");
    }

    // Build the event payload
    const body = this.eventBuilder_.build(eventName, resourceType, resourceId, payload);

    // Order event validation
    const orderEventTypes = ["order.created", "order.updated", "order.cancelled"];
    if (orderEventTypes.includes(eventName)) {
      this.validateOrderEvent(body, eventName);
    }

    // DB idempotency check — if already sent, skip
    const eventRepo = this.getEventRepository();
    const existing = await eventRepo.findOne({
      where: { idempotency_key: body.idempotency_key, status: "SENT" },
    });
    if (existing) {
      this.logger_.warn(`[ApexBooks] replay blocked for idempotency_key=${body.idempotency_key}`);
      return { status: "skipped", message: "duplicate event already sent" };
    }

    // Persist event to queue (PENDING)
    const event = eventRepo.create({
      event_type: eventName,
      resource_type: resourceType,
      resource_id: resourceId,
      idempotency_key: body.idempotency_key,
      payload: body as any,
      status: "PENDING",
      attempt_count: 0,
      max_retries: this.config_.maxRetries,
    });
    const saved = await eventRepo.save(event);

    // Track idempotency key locally
    this.processedOutboundKeys_.add(body.idempotency_key);

    // Attempt delivery immediately (inline first attempt)
    try {
      await this.deliverEvent(saved);
      return { status: "ok", id: body.event_id, queue_id: saved.id };
    } catch (error: any) {
      if (error instanceof ApexBooksRequestError && !error.retryable) {
        // Non-retryable: dead-letter persisted by deliverEvent, propagate to subscriber
        throw error;
      }
      // Retryable or network: event is now FAILED in queue, will be retried by worker
      this.logger_.warn(`[ApexBooks] ${eventName} queued for retry (event_id=${saved.id}): ${error.message}`);
      return { status: "ok", id: body.event_id, queue_id: saved.id, message: "queued for retry" };
    }
  }

  async handleInboundWebhook(payload: Record<string, any>, headers: Record<string, string | string[] | undefined>): Promise<SyncResult> {
    await this.loadConfigFromDb();
    this.verifyWebhook(payload, headers);

    // Cross-tenant enforcement
    const inboundTenant = this.headerValue(headers["x-apexbooks-tenant-id"]);
    const localTenant = this.resolveTenant();
    if (localTenant && inboundTenant && inboundTenant !== localTenant) {
      throw new Error(`Cross-tenant event rejected: header tenant=${inboundTenant}, local tenant=${localTenant}`);
    }

    const eventId = this.headerValue(headers["x-apexbooks-event-id"]) || payload.event_id || payload.id;
    const eventType = this.headerValue(headers["x-apexbooks-event-type"]) || payload.event_type || payload.type;

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
    const apexbooksId = String(data.apexbooks_product_id || data.apexbooks_id || data.id || "");
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
      await this.upsertMapping("product", apexbooksId, existing.id);
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

    await this.upsertMapping("product", apexbooksId, created.id);
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

    const quantity = Number(data.available_quantity ?? data.inventory_quantity ?? data.quantity ?? data.stock ?? 0);
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
    const apexbooksId = String(data.apexbooks_customer_id || data.apexbooks_id || data.id || "");
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
      await this.upsertMapping("customer", apexbooksId, existing.id);
      return { status: "ok", id: updated.id };
    }

    const created = await this.customerService_.create(customerPayload);
    await this.upsertMapping("customer", apexbooksId, created.id);
    return { status: "ok", id: created.id };
  }

  verifyWebhook(payload: Record<string, any>, headers: Record<string, string | string[] | undefined>): void {
    if (!this.config_.webhookSecret) {
      throw new Error("APEXBOOKS_WEBHOOK_SECRET is not configured");
    }

    const contractVersion = this.headerValue(headers["x-apexbooks-contract-version"]);
    if (contractVersion !== APEXBOOKS_CONTRACT_VERSION) {
      throw new Error(`ApexBooks contract validation failed: ${APEXBOOKS_CONTRACT_VERSION_HEADER} must be ${APEXBOOKS_CONTRACT_VERSION}`);
    }

    const timestamp = this.headerValue(headers["x-apexbooks-timestamp"]);
    const signature = this.headerValue(headers["x-apexbooks-signature"]);
    if (!timestamp || !signature) {
      throw new Error("Missing ApexBooks webhook signature headers");
    }

    this.verifyTimestamp(timestamp);

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

  private resolveTenant(): string {
    return this.config_.tenantId;
  }

  private validateOrderEvent(body: Record<string, any>, eventName: string): void {
    // event_id format check
    if (!body.event_id || !body.event_id.startsWith("evt_")) {
      throw new Error(`ApexBooks order event validation failed: event_id must start with evt_`);
    }
    // event_type enum check
    const validOrderTypes = ["order.created", "order.updated", "order.cancelled"];
    if (!validOrderTypes.includes(body.event_type)) {
      throw new Error(`ApexBooks order event validation failed: invalid event_type ${body.event_type}`);
    }
    // contract_version check (already validated by builder but defend in depth)
    if (body.contract_version !== APEXBOOKS_CONTRACT_VERSION) {
      throw new Error(`ApexBooks order event validation failed: contract_version must be ${APEXBOOKS_CONTRACT_VERSION}`);
    }
    // Tenant context was already checked in sendOutboundEvent before build
  }

  private verifyTimestamp(timestamp: string): void {
    const now = Date.now();
    const then = Date.parse(timestamp);
    if (isNaN(then)) {
      throw new Error("Invalid ApexBooks timestamp format");
    }
    if (now - then > HMAC_MAX_AGE_MS) {
      throw new Error("ApexBooks timestamp expired");
    }
    if (then - now > HMAC_CLOCK_SKEW_MS) {
      throw new Error("ApexBooks timestamp is in the future");
    }
  }

  private async request(request: ApexBooksRequest): Promise<Record<string, any>> {
    if (!this.config_.baseUrl || !this.config_.apiKey) {
      throw new Error("ApexBooks base URL/API key is not configured");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config_.timeoutMs);
    const url = `${this.config_.baseUrl}${request.path}`;

    // HMAC request signing
    const timestamp = new Date().toISOString();
    const bodyStr = request.body ? JSON.stringify(request.body) : "";
    const signatureInput = `${timestamp}.${bodyStr}`;
    const signature = crypto
      .createHmac("sha256", this.config_.apiKey)
      .update(signatureInput)
      .digest("hex");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-ApexBooks-Contract-Version": APEXBOOKS_CONTRACT_VERSION,
      "X-ApexBooks-Timestamp": timestamp,
      "X-ApexBooks-Signature": `sha256=${signature}`,
      "X-ApexBooks-Tenant-Id": this.config_.tenantId,
    };
    if (request.idempotencyKey) {
      headers["Idempotency-Key"] = request.idempotencyKey;
    }

    this.logger_.info(`[ApexBooks] request ${request.method} ${url} idempotency=${request.idempotencyKey || ""}`);

    try {
      const response = await fetch(url, {
        method: request.method,
        signal: controller.signal,
        headers,
        body: request.body ? bodyStr : undefined,
      });
      const text = await response.text();
      const parsed = text ? this.safeJson(text) : {};

      this.logger_.info(`[ApexBooks] response ${request.method} ${url} status=${response.status}`);

      if (response.ok) return parsed;
      if (response.status < 500 && response.status !== 429) {
        throw new ApexBooksRequestError(
          `ApexBooks request failed ${response.status}: ${this.truncate(text)}`,
          false,
          response.status
        );
      }
      throw new ApexBooksRequestError(
        `ApexBooks retryable failure ${response.status}: ${this.truncate(text)}`,
        true,
        response.status
      );
    } catch (error: any) {
      if (error instanceof ApexBooksRequestError) throw error;
      // Network errors (fetch failure, abort, timeout) — always retryable
      throw new ApexBooksRequestError(
        `ApexBooks network error: ${error.message}`,
        true,
        0
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  // ─── Queue & Delivery Methods ──────────────────────────────────────────────

  private getEventRepository() {
    return this.manager_.getRepository(ApexBooksOutboundEvent);
  }

  private getMappingRepository() {
    return this.manager_.getRepository(ApexBooksEntityMapping);
  }

  private async deliverEvent(event: ApexBooksOutboundEvent): Promise<void> {
    const repo = this.getEventRepository();

    event.status = "PROCESSING";
    event.attempt_count += 1;
    await repo.save(event);

    try {
      const payload = event.payload as Record<string, any>;
      const response = await this.request({
        method: "POST",
        path: "/webhooks/medusa/events",
        body: payload,
        idempotencyKey: event.idempotency_key,
      });

      // Success
      event.status = "SENT";
      event.sent_at = new Date();
      event.last_error = null;
      event.next_retry_at = null;
      await repo.save(event);

      await this.recordOutboundSync(event.resource_type, event.resource_id, event.event_type, response);
    } catch (error: any) {
      const retryable = error instanceof ApexBooksRequestError ? error.retryable : true;

      if (!retryable) {
        event.status = "DEAD_LETTER";
        event.last_error = error.message;
        event.next_retry_at = null;
        await repo.save(event);
        throw error;
      }

      if (event.attempt_count >= event.max_retries) {
        event.status = "DEAD_LETTER";
        event.last_error = `Max retries (${event.max_retries}) exceeded. Last error: ${error.message}`;
        event.next_retry_at = null;
        await repo.save(event);
        this.logger_.error(`[ApexBooks] event ${event.id} moved to DEAD_LETTER after ${event.attempt_count} attempts`);
        throw error;
      }

      // Schedule retry with exponential backoff
      event.status = "FAILED";
      event.last_error = error.message;
      event.next_retry_at = new Date(Date.now() + 250 * Math.pow(2, event.attempt_count - 1));
      await repo.save(event);
    }
  }

  async processEventQueue(maxEvents: number = QUEUE_BATCH_SIZE): Promise<{ processed: number; succeeded: number; failed: number }> {
    const repo = this.getEventRepository();

    const events = await repo.find({
      where: [
        { status: "FAILED", next_retry_at: LessThanOrEqual(new Date()) },
        { status: "PENDING", next_retry_at: IsNull() },
      ],
      order: { next_retry_at: "ASC", created_at: "ASC" },
      take: maxEvents,
    });

    let succeeded = 0;
    let failed = 0;

    for (const event of events) {
      try {
        await this.deliverEvent(event);
        succeeded++;
      } catch {
        failed++;
      }
    }

    this.logger_.info(`[ApexBooks] queue processed ${events.length} events: ${succeeded} succeeded, ${failed} failed`);
    return { processed: events.length, succeeded, failed };
  }

  async replayEvent(eventId: string): Promise<ApexBooksOutboundEvent> {
    const repo = this.getEventRepository();
    const event = await repo.findOne({ where: { id: eventId } });
    if (!event) throw new Error(`ApexBooks queue event ${eventId} not found`);

    event.status = "PENDING";
    event.attempt_count = 0;
    event.last_error = null;
    event.next_retry_at = null;
    event.sent_at = null;
    return repo.save(event);
  }

  async replayAllFailed(): Promise<number> {
    const repo = this.getEventRepository();
    const events = await repo.find({
      where: [{ status: "FAILED" }, { status: "DEAD_LETTER" }],
    });

    for (const event of events) {
      event.status = "PENDING";
      event.attempt_count = 0;
      event.last_error = null;
      event.next_retry_at = null;
      event.sent_at = null;
    }

    await repo.save(events);
    this.logger_.info(`[ApexBooks] replayed ${events.length} failed/dead-letter events`);
    return events.length;
  }

  async listQueueEvents(status?: string): Promise<ApexBooksOutboundEvent[]> {
    const repo = this.getEventRepository();
    const where: any = {};
    if (status) {
      where.status = status;
    }
    return repo.find({ where, order: { created_at: "DESC" }, take: 100 });
  }

  private async upsertMapping(entityType: string, apexbooksId: string, medusaEntityId: string): Promise<void> {
    const mappingRepo = this.getMappingRepository();
    const existing = await mappingRepo.findOne({
      where: { entity_type: entityType, apexbooks_id: apexbooksId },
    });
    if (existing) {
      if (existing.medusa_entity_id !== medusaEntityId) {
        existing.medusa_entity_id = medusaEntityId;
        await mappingRepo.save(existing);
      }
    } else {
      await mappingRepo.save({
        entity_type: entityType,
        apexbooks_id: apexbooksId,
        medusa_entity_id: medusaEntityId,
      });
    }
  }

  // ─── Sync Tracking ─────────────────────────────────────────────────────────

  private async recordOutboundSync(resourceType: string, resourceId: string, eventName: string, response: Record<string, any>): Promise<void> {
    let service: any = null;

    switch (resourceType) {
      case "order":
        service = this.orderService_;
        break;
      case "customer":
        service = this.customerService_;
        break;
      default:
        // Payment, refund, return: tracked through queue persistence + logs
        this.logger_.info(
          `[ApexBooks] outbound ${eventName} recorded for ${resourceType}/${resourceId} (queue_id=${response.id || "unknown"})`
        );
        return;
    }

    if (!service) {
      this.logger_.warn(`[ApexBooks] no service available for resource type ${resourceType}`);
      return;
    }

    try {
      const entity = await service.retrieve(resourceId);
      const metadata = this.mergeSyncMetadata(entity.metadata, eventName, response);
      await service.update(resourceId, { metadata });
    } catch (error: any) {
      this.logger_.warn(`[ApexBooks] failed to record sync metadata for ${resourceType}/${resourceId}: ${error.message}`);
    }
  }

  private async requireProduct(data: Record<string, any>): Promise<any> {
    const apexbooksId = data.apexbooks_product_id || data.product_id || data.apexbooks_id || data.id;
    const product = await this.findProductByApexBooksId(String(apexbooksId));
    if (!product) throw new Error(`Product not found for ApexBooks id ${apexbooksId}`);
    return this.productService_.retrieve(product.id, { relations: ["variants"] });
  }

  private async findProductByApexBooksId(apexbooksId: string): Promise<any | null> {
    const mappingRepo = this.getMappingRepository();

    // Indexed lookup via mapping table
    const mapping = await mappingRepo.findOne({
      where: { entity_type: "product", apexbooks_id: apexbooksId },
    });
    if (mapping) {
      try {
        return await this.productService_.retrieve(mapping.medusa_entity_id);
      } catch {
        await mappingRepo.remove(mapping);
      }
    }

    // Fallback: full scan (legacy data)
    const products = await this.productService_.list({}, { take: 10000 });
    const found = products.find((product: any) => {
      const apexbooks = product.metadata?.[APEXBOOKS_METADATA_KEY];
      return apexbooks?.id === apexbooksId || apexbooks?.product_id === apexbooksId;
    });

    if (found) {
      await mappingRepo.save({
        apexbooks_id: apexbooksId,
        medusa_entity_id: found.id,
        entity_type: "product",
      });
    }

    return found || null;
  }

  private async findCustomerByApexBooksId(apexbooksId: string, email?: string): Promise<any | null> {
    const mappingRepo = this.getMappingRepository();

    // Indexed lookup via mapping table
    const mapping = await mappingRepo.findOne({
      where: { entity_type: "customer", apexbooks_id: apexbooksId },
    });
    if (mapping) {
      try {
        return await this.customerService_.retrieve(mapping.medusa_entity_id);
      } catch {
        await mappingRepo.remove(mapping);
      }
    }

    // Fallback: full scan (legacy data)
    const customers = await this.customerService_.list({}, { take: 10000 });
    const found = customers.find((customer: any) => {
      const apexbooks = customer.metadata?.[APEXBOOKS_METADATA_KEY];
      return apexbooks?.id === apexbooksId || apexbooks?.customer_id === apexbooksId;
    }) || (email ? customers.find((customer: any) => customer.email === email) : null) || null;

    if (found) {
      await mappingRepo.save({
        apexbooks_id: apexbooksId,
        medusa_entity_id: found.id,
        entity_type: "customer",
      });
    }

    return found || null;
  }

  private mergeApexBooksMetadata(current: Record<string, any> | null | undefined, apexbooksId: string, eventId: string, payload: Record<string, any>): Record<string, any> {
    const metadata = { ...(current || {}) };
    const currentApex = metadata[APEXBOOKS_METADATA_KEY] || {};
    const processed = Array.isArray(currentApex.processed_event_ids) ? currentApex.processed_event_ids : [];

    metadata[APEXBOOKS_METADATA_KEY] = {
      ...currentApex,
      id: apexbooksId,
      product_id: apexbooksId,
      customer_id: apexbooksId,
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
