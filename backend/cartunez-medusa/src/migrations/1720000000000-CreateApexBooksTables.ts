import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateApexBooksTables1720000000000 implements MigrationInterface {
  name = "CreateApexBooksTables1720000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "apexbooks_outbound_event" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "event_type" character varying(100) NOT NULL,
        "resource_type" character varying(50) NOT NULL,
        "resource_id" character varying(255) NOT NULL,
        "idempotency_key" character varying(255) NOT NULL,
        "payload" jsonb NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'PENDING',
        "attempt_count" integer NOT NULL DEFAULT 0,
        "max_retries" integer NOT NULL DEFAULT 10,
        "last_error" text,
        "next_retry_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "sent_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_apexbooks_outbound_event" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_apexbooks_event_idempotency_key"
        ON "apexbooks_outbound_event" ("idempotency_key")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_apexbooks_event_status_retry"
        ON "apexbooks_outbound_event" ("status", "next_retry_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_apexbooks_event_resource"
        ON "apexbooks_outbound_event" ("resource_type", "resource_id")
    `);

    await queryRunner.query(`
      CREATE TABLE "apexbooks_entity_mapping" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "apexbooks_id" character varying(255) NOT NULL,
        "medusa_entity_id" character varying(255) NOT NULL,
        "entity_type" character varying(50) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_apexbooks_entity_mapping" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_apexbooks_mapping_type_id"
        ON "apexbooks_entity_mapping" ("entity_type", "apexbooks_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_apexbooks_mapping_medusa_id"
        ON "apexbooks_entity_mapping" ("medusa_entity_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "apexbooks_entity_mapping"`);
    await queryRunner.query(`DROP TABLE "apexbooks_outbound_event"`);
  }
}
