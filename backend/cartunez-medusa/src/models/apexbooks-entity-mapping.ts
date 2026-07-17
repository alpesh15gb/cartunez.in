import { Entity as Entity_, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity_("apexbooks_entity_mapping")
@Index(["entity_type", "apexbooks_id"], { unique: true })
export class ApexBooksEntityMapping {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  apexbooks_id: string;

  @Column({ type: "varchar", length: 255 })
  @Index()
  medusa_entity_id: string;

  @Column({ type: "varchar", length: 50 })
  entity_type: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
