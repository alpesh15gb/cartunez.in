import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVehicleTables1718000000000 implements MigrationInterface {
  name = "CreateVehicleTables1718000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "vehicle_make" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(100) NOT NULL,
        "country" character varying(50),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_vehicle_make_name" UNIQUE ("name"),
        CONSTRAINT "PK_vehicle_make" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "vehicle_model" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(150) NOT NULL,
        "make_id" uuid NOT NULL,
        "body_type" character varying(50),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicle_model" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_model_make_id" ON "vehicle_model" ("make_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicle_model" ADD CONSTRAINT "FK_vehicle_model_make"
        FOREIGN KEY ("make_id") REFERENCES "vehicle_make"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "vehicle_year" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "year" integer NOT NULL,
        "model_id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicle_year" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_year_model_id" ON "vehicle_year" ("model_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicle_year" ADD CONSTRAINT "FK_vehicle_year_model"
        FOREIGN KEY ("model_id") REFERENCES "vehicle_model"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "vehicle_variant" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(200) NOT NULL,
        "year_id" uuid NOT NULL,
        "engine_type" character varying(50),
        "fuel_type" character varying(50),
        "transmission" character varying(50),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicle_variant" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_variant_year_id" ON "vehicle_variant" ("year_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "vehicle_variant" ADD CONSTRAINT "FK_vehicle_variant_year"
        FOREIGN KEY ("year_id") REFERENCES "vehicle_year"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE TABLE "product_vehicle_compatibility" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "product_id" uuid NOT NULL,
        "vehicle_variant_id" uuid NOT NULL,
        "fitment_type" character varying(20),
        "notes" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_vehicle_compatibility" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_product_vehicle_compat_product_id" ON "product_vehicle_compatibility" ("product_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_product_vehicle_compat_variant_id" ON "product_vehicle_compatibility" ("vehicle_variant_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "product_vehicle_compatibility" ADD CONSTRAINT "FK_product_vehicle_compat_variant"
        FOREIGN KEY ("vehicle_variant_id") REFERENCES "vehicle_variant"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "product_vehicle_compatibility"`);
    await queryRunner.query(`DROP TABLE "vehicle_variant"`);
    await queryRunner.query(`DROP TABLE "vehicle_year"`);
    await queryRunner.query(`DROP TABLE "vehicle_model"`);
    await queryRunner.query(`DROP TABLE "vehicle_make"`);
  }
}
