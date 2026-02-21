import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
  Index,
  Unique,
} from "typeorm";
import { ClinicEntity } from "./clinic.entity";
import { DoctorEntity } from "./doctor.entity";

@Entity("availability_rules")
@Check(`"end_time" > "start_time"`)
@Check(`"day_of_week" >= 0 AND "day_of_week" <= 6`)
@Unique(["doctorId", "dayOfWeek", "startTime"])
@Index("idx_availability_rules_clinic_id", ["clinicId"])
export class AvailabilityRuleEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "clinic_id", type: "uuid" })
  clinicId!: string;

  @Column({ name: "doctor_id", type: "uuid" })
  doctorId!: string;

  @Column({ name: "day_of_week", type: "smallint" })
  dayOfWeek!: number;

  @Column({ name: "start_time", type: "time" })
  startTime!: string;

  @Column({ name: "end_time", type: "time" })
  endTime!: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

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
