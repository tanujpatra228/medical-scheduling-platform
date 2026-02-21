import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { ClinicEntity } from "./clinic.entity";
import { AppointmentEntity } from "./appointment.entity";
import { UserEntity } from "./user.entity";

@Entity("audit_logs")
@Index("idx_audit_logs_clinic_id", ["clinicId"])
@Index("idx_audit_logs_appointment", ["appointmentId", "createdAt"])
export class AuditLogEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "clinic_id", type: "uuid" })
  clinicId!: string;

  @Column({ name: "appointment_id", type: "uuid" })
  appointmentId!: string;

  @Column({ name: "actor_id", type: "uuid" })
  actorId!: string;

  @Column({ type: "varchar", length: 50 })
  action!: string;

  @Column({ name: "from_status", type: "varchar", length: 20, nullable: true })
  fromStatus!: string | null;

  @Column({ name: "to_status", type: "varchar", length: 20, nullable: true })
  toStatus!: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  // No updatedAt - audit logs are immutable

  @ManyToOne(() => ClinicEntity)
  @JoinColumn({ name: "clinic_id" })
  clinic!: ClinicEntity;

  @ManyToOne(() => AppointmentEntity)
  @JoinColumn({ name: "appointment_id" })
  appointment!: AppointmentEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "actor_id" })
  actor!: UserEntity;
}
