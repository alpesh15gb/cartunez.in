import crypto from "crypto";

export const APEXBOOKS_CONTRACT_VERSION = "v1";
export const APEXBOOKS_CONTRACT_VERSION_HEADER = "X-ApexBooks-Contract-Version";

type Money = {
  currency_code: string;
  amount: number;
};

type ApexBooksOutboundEvent = {
  contract_version: "v1";
  event_id: string;
  event_type: string;
  occurred_at: string;
  idempotency_key: string;
  [key: string]: any;
};

const EVENT_OBJECT_BY_TYPE: Record<string, string> = {
  "order.created": "order",
  "order.updated": "order",
  "order.cancelled": "order",
  "payment.captured": "payment",
  "payment.refunded": "refund",
  "return.created": "return",
  "customer.created": "customer",
};

export default class ApexBooksEventBuilder {
  build(eventType: string, resourceType: string, resourceId: string, source: Record<string, any>): ApexBooksOutboundEvent {
    const eventObject = EVENT_OBJECT_BY_TYPE[eventType];
    if (!eventObject) {
      throw new Error(`Unsupported ApexBooks outbound event type: ${eventType}`);
    }

    const idempotencyKey = `${eventType}:${resourceType}:${resourceId}`;
    const envelope: ApexBooksOutboundEvent = {
      contract_version: APEXBOOKS_CONTRACT_VERSION,
      event_id: this.generateEventId(eventType, resourceId),
      event_type: eventType,
      occurred_at: new Date().toISOString(),
      idempotency_key: idempotencyKey,
      [eventObject]: this.buildEventObject(eventType, source),
    };

    this.validate(envelope);
    return envelope;
  }

  validate(payload: Record<string, any>): void {
    for (const field of ["contract_version", "event_id", "event_type", "occurred_at", "idempotency_key"]) {
      if (!payload[field]) {
        throw new Error(`ApexBooks outbound payload missing ${field}`);
      }
    }

    if (payload.contract_version !== APEXBOOKS_CONTRACT_VERSION) {
      throw new Error(`ApexBooks outbound payload contract_version must be ${APEXBOOKS_CONTRACT_VERSION}`);
    }

    if (payload.event || payload.data) {
      throw new Error("ApexBooks outbound payload must not use generic event/data fields");
    }

    const eventObject = EVENT_OBJECT_BY_TYPE[payload.event_type];
    if (!eventObject || !payload[eventObject]) {
      throw new Error(`ApexBooks outbound payload missing ${eventObject || "event-specific object"}`);
    }
  }

  private buildEventObject(eventType: string, source: Record<string, any>): Record<string, any> {
    switch (eventType) {
      case "order.created":
      case "order.updated":
      case "order.cancelled":
        return this.buildOrder(source);
      case "payment.captured":
        return this.buildPayment(source);
      case "payment.refunded":
        return this.buildRefund(source);
      case "return.created":
        return this.buildReturn(source);
      case "customer.created":
        return this.buildCustomer(source);
      default:
        throw new Error(`Unsupported ApexBooks outbound event type: ${eventType}`);
    }
  }

  private buildOrder(order: Record<string, any>): Record<string, any> {
    const currency = this.currency(order.currency_code);
    const billingAddress = this.buildAddress(order.billing_address || order.shipping_address || {});
    const shippingAddress = this.buildAddress(order.shipping_address || order.billing_address || {});
    const customer = this.buildCustomer({
      ...(order.customer || {}),
      billing_address: order.billing_address || order.customer?.billing_address,
      shipping_address: order.shipping_address || order.customer?.shipping_address,
    });
    const items = (order.items || []).map((item: Record<string, any>) => this.buildOrderLineItem(item, currency));
    const gstSummary = this.gstSummary(items, currency, order);

    return {
      apexbooks_order_id: order.metadata?.apexbooks?.order_id || null,
      apexbooks_invoice_id: order.metadata?.apexbooks?.invoice_id || null,
      medusa_order_id: String(order.id || ""),
      display_id: order.display_id ?? "",
      status: String(order.status || "pending"),
      currency_code: currency,
      customer,
      billing_address: billingAddress,
      shipping_address: shippingAddress,
      items,
      subtotal: this.money(currency, order.subtotal),
      discount_total: this.money(currency, order.discount_total),
      tax_total: this.money(currency, order.tax_total),
      shipping_total: this.money(currency, order.shipping_total),
      total: this.money(currency, order.total),
      gst_summary: gstSummary,
      metadata: order.metadata || {},
    };
  }

  private buildPayment(payment: Record<string, any>): Record<string, any> {
    const currency = this.currency(payment.currency_code || payment.currency);
    return {
      apexbooks_payment_id: payment.metadata?.apexbooks?.payment_id || null,
      medusa_payment_id: String(payment.id || ""),
      medusa_order_id: String(payment.order_id || payment.order?.id || ""),
      provider_id: String(payment.provider_id || payment.provider || ""),
      transaction_id: payment.data?.id || payment.data?.transaction_id || payment.transaction_id || null,
      amount: this.money(currency, payment.amount),
      captured_at: this.dateTime(payment.captured_at || payment.updated_at || payment.created_at),
      metadata: payment.metadata || {},
    };
  }

  private buildRefund(refund: Record<string, any>): Record<string, any> {
    const currency = this.currency(refund.currency_code || refund.order?.currency_code);
    const items = refund.items || refund.line_items || [];
    return {
      apexbooks_refund_id: refund.metadata?.apexbooks?.refund_id || null,
      medusa_refund_id: String(refund.id || ""),
      medusa_order_id: String(refund.order_id || refund.order?.id || ""),
      original_invoice: {
        apexbooks_invoice_id: refund.order?.metadata?.apexbooks?.invoice_id || refund.metadata?.apexbooks?.invoice_id || "unknown",
        invoice_number: refund.metadata?.apexbooks?.invoice_number || null,
        invoice_date: refund.metadata?.apexbooks?.invoice_date || null,
      },
      amount: this.money(currency, refund.amount),
      line_items: items.length ? items.map((item: Record<string, any>) => this.buildRefundLineItem(item, currency, refund)) : [this.placeholderRefundLineItem(currency, refund)],
      refund_tax_total: this.money(currency, refund.tax_total),
      refund_total: this.money(currency, refund.amount),
      reason: refund.reason || refund.note || null,
    };
  }

  private buildReturn(returnRequest: Record<string, any>): Record<string, any> {
    const currency = this.currency(returnRequest.currency_code || returnRequest.order?.currency_code);
    const items = returnRequest.items || returnRequest.line_items || [];
    return {
      medusa_return_id: String(returnRequest.id || ""),
      medusa_order_id: String(returnRequest.order_id || returnRequest.order?.id || ""),
      items: items.length ? items.map((item: Record<string, any>) => this.buildRefundLineItem(item, currency, returnRequest)) : [this.placeholderRefundLineItem(currency, returnRequest)],
    };
  }

  private buildCustomer(customer: Record<string, any>): Record<string, any> {
    const billingAddress = this.buildAddress(customer.billing_address || customer.billing_address_id || {});
    const shippingAddress = this.buildAddress(customer.shipping_address || customer.shipping_address_id || customer.billing_address || {});
    return {
      apexbooks_customer_id: customer.metadata?.apexbooks?.customer_id || customer.metadata?.apexbooks?.id || null,
      medusa_customer_id: String(customer.id || ""),
      email: String(customer.email || "unknown@example.com"),
      first_name: customer.first_name || null,
      last_name: customer.last_name || null,
      phone: customer.phone || billingAddress.phone || shippingAddress.phone || null,
      gst: {
        gstin: customer.metadata?.gst?.gstin || null,
        gst_type: customer.metadata?.gst?.gst_type || "consumer",
        state_code: customer.metadata?.gst?.state_code || billingAddress.state_code || shippingAddress.state_code || "00",
      },
      billing_address: billingAddress,
      shipping_address: shippingAddress,
    };
  }

  private buildAddress(address: Record<string, any>): Record<string, any> {
    const firstName = address.first_name || "";
    const lastName = address.last_name || "";
    const name = address.name || [firstName, lastName].filter(Boolean).join(" ") || "Unknown";
    return {
      name,
      company: address.company || null,
      phone: address.phone || null,
      address_1: String(address.address_1 || "Unknown"),
      address_2: address.address_2 || null,
      city: String(address.city || "Unknown"),
      province: address.province || null,
      postal_code: String(address.postal_code || "000000"),
      country_code: this.country(address.country_code),
      state_code: String(address.metadata?.gst_state_code || address.state_code || "00"),
    };
  }

  private buildOrderLineItem(item: Record<string, any>, currency: string): Record<string, any> {
    const quantity = Number(item.quantity || 1);
    const unitPrice = Number(item.unit_price || 0);
    const subtotal = Number(item.subtotal ?? unitPrice * quantity);
    const discount = Number(item.discount_total || 0);
    const total = Number(item.total ?? subtotal - discount);
    return {
      apexbooks_item_id: item.metadata?.apexbooks?.item_id || item.variant?.metadata?.apexbooks?.item_id || null,
      medusa_line_item_id: String(item.id || ""),
      medusa_product_id: item.variant?.product_id || item.product_id || null,
      medusa_variant_id: String(item.variant_id || item.variant?.id || ""),
      sku: item.variant?.sku || item.sku || null,
      title: String(item.title || item.variant?.title || "Unknown item"),
      quantity,
      unit_price: this.money(currency, unitPrice),
      line_subtotal: this.money(currency, subtotal),
      discount_total: this.money(currency, discount),
      line_total: this.money(currency, total),
      gst: this.gst(currency, item, subtotal, discount, Number(item.tax_total || 0)),
    };
  }

  private buildRefundLineItem(item: Record<string, any>, currency: string, source: Record<string, any>): Record<string, any> {
    const quantity = Number(item.quantity || 1);
    const unitPrice = Number(item.unit_price || item.item?.unit_price || 0);
    const subtotal = Number(item.refund_subtotal || item.subtotal || source.amount || unitPrice * quantity);
    return {
      medusa_line_item_id: String(item.item_id || item.line_item_id || item.id || ""),
      apexbooks_item_id: item.metadata?.apexbooks?.item_id || item.item?.metadata?.apexbooks?.item_id || null,
      quantity,
      unit_price: this.money(currency, unitPrice),
      refund_subtotal: this.money(currency, subtotal),
      taxes: this.gst(currency, item, subtotal, 0, Number(item.tax_total || 0)),
      restock: Boolean(item.restock ?? source.restock ?? true),
      reason: item.reason || source.reason || null,
    };
  }

  private placeholderRefundLineItem(currency: string, source: Record<string, any>): Record<string, any> {
    const amount = Number(source.amount || 0);
    return {
      medusa_line_item_id: String(source.item_id || source.line_item_id || source.id || ""),
      apexbooks_item_id: null,
      quantity: 1,
      unit_price: this.money(currency, amount),
      refund_subtotal: this.money(currency, amount),
      taxes: this.gst(currency, source, amount, 0, Number(source.tax_total || 0)),
      restock: Boolean(source.restock ?? true),
      reason: source.reason || null,
    };
  }

  private gstSummary(items: Array<Record<string, any>>, currency: string, source: Record<string, any>): Record<string, any> {
    if (!items.length) {
      return this.gst(currency, source, Number(source.subtotal || 0), Number(source.discount_total || 0), Number(source.tax_total || 0));
    }

    const summary = items.reduce((current, item) => {
      for (const key of ["taxable_value", "tax_amount", "cgst", "sgst", "igst", "cess", "discount_allocation"]) {
        current[key] = (current[key] || 0) + Number(item.gst[key]?.amount || 0);
      }
      return current;
    }, {} as Record<string, number>);

    return {
      hsn_sac: items[0].gst.hsn_sac,
      gst_rate: items[0].gst.gst_rate,
      taxable_value: this.money(currency, summary.taxable_value),
      tax_amount: this.money(currency, summary.tax_amount),
      cgst: this.money(currency, summary.cgst),
      sgst: this.money(currency, summary.sgst),
      igst: this.money(currency, summary.igst),
      cess: this.money(currency, summary.cess),
      discount_allocation: this.money(currency, summary.discount_allocation),
    };
  }

  private gst(currency: string, source: Record<string, any>, subtotal: number, discount: number, tax: number): Record<string, any> {
    const taxableValue = Math.max(0, subtotal - discount);
    const taxAmount = Number.isFinite(tax) ? tax : 0;
    const halfTax = Math.floor(taxAmount / 2);
    return {
      hsn_sac: String(source.metadata?.gst?.hsn_sac || source.hsn_sac || "unknown"),
      gst_rate: Number(source.metadata?.gst?.gst_rate || source.gst_rate || 0),
      taxable_value: this.money(currency, taxableValue),
      tax_amount: this.money(currency, taxAmount),
      cgst: this.money(currency, halfTax),
      sgst: this.money(currency, taxAmount - halfTax),
      igst: this.money(currency, 0),
      cess: this.money(currency, 0),
      discount_allocation: this.money(currency, discount),
    };
  }

  private money(currency: string, amount: any): Money {
    return {
      currency_code: this.currency(currency),
      amount: Number(amount || 0),
    };
  }

  private currency(value: any): string {
    return String(value || "inr").toLowerCase();
  }

  private country(value: any): string {
    return String(value || "in").toLowerCase();
  }

  private dateTime(value: any): string {
    return value ? new Date(value).toISOString() : new Date().toISOString();
  }

  private generateEventId(eventType: string, resourceId: string): string {
    const slug = eventType.replace(/[^a-z0-9]+/g, "_");
    return `evt_medusa_${slug}_${resourceId}_${crypto.randomUUID()}`;
  }
}
