#!/bin/bash
# Full database reset - deletes all products, variants, options, categories, and collections
set -e

PG="docker compose exec -T postgres psql -U postgres -d cartunez"

echo "Resetting database..."

$PG << 'SQL'
DELETE FROM product_variant_money_amount;
DELETE FROM money_amount;
DELETE FROM product_option_value;
DELETE FROM product_option;
DELETE FROM product_variant;
DELETE FROM product_image;
DELETE FROM product_category_product;
DELETE FROM product_category;
DELETE FROM product_tag;
DELETE FROM product_tags;
DELETE FROM product_collection_product;
DELETE FROM product_collection;
DELETE FROM product;

SELECT 'products: ' || COUNT(*) FROM product;
SELECT 'categories: ' || COUNT(*) FROM product_category;
SQL

echo "Reset complete!"
