import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from "typeorm";
import { ClinicEntity } from "./clinic.entity";
import { DoctorEntity } from "./doctor.entity";
import { PatientEntity } from "./patient.entity";
import { UserEntity } from "./user.entity";

export enum AppointmentStatusEnum {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  NO_SHOW = "NO_SHOW",
}

@Entity("appointments")
@Check(`"ends_at" > "starts_at"`)
@Index("idx_appointments_clinic_id", ["clinicId"])
@Index("idx_appointments_doctor_date", ["doctorId", "startsAt"])
@Index("idx_appointments_patient_id", ["patientId"])
export class AppointmentEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "clinic_id", type: "uuid" })
  clinicId!: string;

  @Column({ name: "doctor_id", type: "uuid" })
  doctorId!: string;

  @Column({ name: "patient_id", type: "uuid" })
  patientId!: string;

  @Column({ name: "starts_at", type: "timestamptz" })
  startsAt!: Date;

  @Column({ name: "ends_at", type: "timestamptz" })
  endsAt!: Date;

  @Column({
    type: "enum",
    enum: AppointmentStatusEnum,
    default: AppointmentStatusEnum.PENDING,
  })
  status!: AppointmentStatusEnum;

  @Column({ type: "text", nullable: true })
  reason!: string | null;

  @Column({ name: "cancellation_reason", type: "text", nullable: true })
  cancellationReason!: string | null;

  @Column({ name: "cancelled_by", type: "uuid", nullable: true })
  cancelledBy!: string | null;

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

  @ManyToOne(() => PatientEntity)
  @JoinColumn({ name: "patient_id" })
  patient!: PatientEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "cancelled_by" })
  cancelledByUser!: UserEntity | null;
}
