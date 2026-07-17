import { Entity as Entity_, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity_("integration_apps")
export class IntegrationApp {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "varchar", length: 50 })
  type: string;

  @Column({ type: "varchar", length: 20, default: "1.0.0" })
  version: string;

  @Column({ type: "varchar", length: 20, default: "active" })
  status: string;

  @Column({ type: "jsonb" })
  config_schema: Record<string, any>;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
