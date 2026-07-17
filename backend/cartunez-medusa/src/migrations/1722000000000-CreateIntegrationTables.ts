import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateIntegrationTables1722000000000 implements MigrationInterface {
  name = "CreateIntegrationTables1722000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "integration_apps" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(100) NOT NULL,
        "type" character varying(50) NOT NULL,
        "version" character varying(20) NOT NULL DEFAULT '1.0.0',
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "config_schema" jsonb NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_integration_apps" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "integration_connections" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" character varying(255) NOT NULL,
        "app_id" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "encrypted_credentials" text NOT NULL,
        "configuration" jsonb NOT NULL DEFAULT '{}',
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_integration_connections" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "integration_event_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "connection_id" uuid NOT NULL,
        "event_type" character varying(100) NOT NULL,
        "status" character varying(20) NOT NULL,
        "request_payload" jsonb NOT NULL,
        "response_status" integer,
        "response_body" text,
        "error_message" text,
        "attempt_count" integer NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_integration_event_logs" PRIMARY KEY ("id")
      )
    `);

    // Indexes for integration_connections
    await queryRunner.query(`
      CREATE INDEX "IDX_integration_connections_tenant_app"
        ON "integration_connections" ("tenant_id", "app_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_integration_connections_tenant"
        ON "integration_connections" ("tenant_id")
    `);

    // Indexes for integration_event_logs
    await queryRunner.query(`
      CREATE INDEX "IDX_integration_event_logs_connection"
        ON "integration_event_logs" ("connection_id", "created_at")
    `);

    // Seed ApexBooks app definition
    await queryRunner.query(`
      INSERT INTO "integration_apps" ("name", "type", "version", "config_schema")
      VALUES (
        'ApexBooks ERP',
        'apexbooks',
        '1.0.0',
        '{
          "type": "object",
          "properties": {
            "baseUrl": {
              "type": "string",
              "title": "API Base URL",
              "description": "ApexBooks API endpoint",
              "placeholder": "https://api.apexbooks.in"
            },
            "tenantId": {
              "type": "string",
              "title": "Tenant ID",
              "description": "ApexBooks tenant identifier",
              "placeholder": "your-tenant-id"
            },
            "timeoutMs": {
              "type": "number",
              "title": "Request Timeout (ms)",
              "description": "HTTP request timeout in milliseconds",
              "default": 10000
            },
            "maxRetries": {
              "type": "number",
              "title": "Max Retries",
              "description": "Maximum delivery retry attempts",
              "default": 10
            }
          },
          "required": ["baseUrl", "tenantId"],
          "secret_fields": ["apiKey", "webhookSecret"]
        }'::jsonb
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "integration_event_logs"`);
    await queryRunner.query(`DROP TABLE "integration_connections"`);
    await queryRunner.query(`DROP TABLE "integration_apps"`);
  }
}
