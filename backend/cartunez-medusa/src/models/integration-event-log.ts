import { Entity as Entity_, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity_("integration_event_logs")
@Index(["connection_id", "created_at"])
export class IntegrationEventLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  connection_id: string;

  @Column({ type: "varchar", length: 100 })
  event_type: string;

  @Column({ type: "varchar", length: 20 })
  status: string;

  @Column({ type: "jsonb" })
  request_payload: Record<string, any>;

  @Column({ type: "int", nullable: true })
  response_status: number | null;

  @Column({ type: "text", nullable: true })
  response_body: string | null;

  @Column({ type: "text", nullable: true })
  error_message: string | null;

  @Column({ type: "int", default: 1 })
  attempt_count: number;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;
}
