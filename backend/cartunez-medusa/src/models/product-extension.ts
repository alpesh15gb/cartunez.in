/**
 * Product Extension Metadata for Cartunez Automotive E-Commerce.
 *
 * These fields are stored in the `product.metadata` JSON column via the
 * Medusa Product Service, or can be projected into custom columns via
 * a subscriber / loader.
 */

export interface ProductMetadata {
  // SKU & Identification
  sku?: string;
  barcode?: string;
  hsn_code?: string; // Indian HSN for GST
  part_number?: string;
  oem_number?: string;
  upc?: string;
  ean?: string;

  // Brand & Supplier
  brand?: string;
  manufacturer?: string;
  supplier?: string;
  supplier_sku?: string;
  country_of_origin?: string;

  // Warehouse & Inventory
  warehouse_location?: string;
  shelf_location?: string;
  bin_number?: string;
  weight_grams?: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;

  // Pricing
  purchase_cost?: number; // cost price in cents
  mrp?: number; // maximum retail price in cents
  margin_percentage?: number;

  // GST & Tax (India specific)
  gst_rate?: number; // 0, 5, 12, 18, 28
  hsn_description?: string;
  is_gst_inclusive?: boolean;

  // Vehicle Compatibility
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year_from?: number;
  vehicle_year_to?: number;
  vehicle_fuel_type?: string;
  vehicle_transmission?: string;
  vehicle_body_type?: string;
  vehicle_compatibility?: string; // human-readable summary
  compatible_vehicle_ids?: string[]; // vehicle variant UUIDs

  // Automotive Specific
  part_category?: string; // "brakes", "engine", "electrical", etc.
  part_subcategory?: string;
  position?: string; // "front", "rear", "left", "right"
  side?: string; // "driver", "passenger"
  axle_position?: string;
  engine_code?: string;
  chassis_code?: string;

  // Condition & Warranty
  condition?: string; // "new", "refurbished", "used", "oem", "aftermarket"
  warranty_months?: number;
  warranty_description?: string;

  // SEO & Search
  meta_title?: string;
  meta_description?: string;
  search_keywords?: string[];

  // Flags
  is_fast_moving?: boolean;
  is_hazardous?: boolean;
  requires_special_shipping?: boolean;
  is_oem_part?: boolean;
  is_aftermarket_part?: boolean;
  is_consumable?: boolean;
  is_warranty_void_if_modified?: boolean;
}

/**
 * Create a typed metadata accessor for a product.
 */
export function getProductMetadata(metadata: Record<string, unknown> | null | undefined): ProductMetadata {
  return (metadata || {}) as ProductMetadata;
}
