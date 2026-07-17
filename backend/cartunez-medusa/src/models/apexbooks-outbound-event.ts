import { Entity as Entity_, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity_("apexbooks_outbound_event")
@Index("IDX_apexbooks_queue_status_retry", ["status", "next_retry_at"])
export class ApexBooksOutboundEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100 })
  event_type: string;

  @Column({ type: "varchar", length: 50 })
  resource_type: string;

  @Column({ type: "varchar", length: 255 })
  resource_id: string;

  @Column({ type: "varchar", length: 255 })
  @Index({ unique: true })
  idempotency_key: string;

  @Column({ type: "jsonb" })
  payload: Record<string, any>;

  @Column({ type: "varchar", length: 20, default: "PENDING" })
  status: string;

  @Column({ type: "int", default: 0 })
  attempt_count: number;

  @Column({ type: "int", default: 10 })
  max_retries: number;

  @Column({ type: "text", nullable: true })
  last_error: string | null;

  @Column({ type: "timestamptz", nullable: true })
  next_retry_at: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @Column({ type: "timestamptz", nullable: true })
  sent_at: Date | null;
}
