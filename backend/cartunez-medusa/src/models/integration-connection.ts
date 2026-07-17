import { Entity as Entity_, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity_("integration_connections")
@Index(["tenant_id", "app_id"])
@Index(["tenant_id"])
export class IntegrationConnection {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  tenant_id: string;

  @Column({ type: "uuid" })
  app_id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text" })
  encrypted_credentials: string;

  @Column({ type: "jsonb", default: {} })
  configuration: Record<string, any>;

  @Column({ type: "varchar", length: 20, default: "active" })
  status: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
