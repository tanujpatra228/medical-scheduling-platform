import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { ClinicEntity } from "./clinic.entity";
import { UserEntity } from "./user.entity";

@Entity("doctors")
export class DoctorEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid", unique: true })
  userId!: string;

  @Column({ name: "clinic_id", type: "uuid" })
  clinicId!: string;

  @Column({ type: "varchar", length: 255 })
  specialization!: string;

  @Column({ name: "slot_duration_min", type: "integer", default: 30 })
  slotDurationMin!: number;

  @Column({ name: "max_daily_appointments", type: "integer", nullable: true })
  maxDailyAppointments!: number | null;

  @Column({ name: "google_calendar_id", type: "varchar", length: 255, nullable: true })
  googleCalendarId!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;

  @ManyToOne(() => ClinicEntity)
  @JoinColumn({ name: "clinic_id" })
  clinic!: ClinicEntity;
}
