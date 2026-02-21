import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { ClinicEntity } from "./clinic.entity";
import { DoctorEntity } from "./doctor.entity";

@Entity("availability_overrides")
@Index("idx_availability_overrides_doctor_date", ["doctorId", "date"])
export class AvailabilityOverrideEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "clinic_id", type: "uuid" })
  clinicId!: string;

  @Column({ name: "doctor_id", type: "uuid" })
  doctorId!: string;

  @Column({ type: "date" })
  date!: Date;

  @Column({ name: "start_time", type: "time", nullable: true })
  startTime!: string | null;

  @Column({ name: "end_time", type: "time", nullable: true })
  endTime!: string | null;

  @Column({ name: "is_available", type: "boolean" })
  isAvailable!: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  reason!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne(() => ClinicEntity)
  @JoinColumn({ name: "clinic_id" })
  clinic!: ClinicEntity;

  @ManyToOne(() => DoctorEntity)
  @JoinColumn({ name: "doctor_id" })
  doctor!: DoctorEntity;
}
