import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ClinicEntity } from "./clinic.entity";
import { UserEntity } from "./user.entity";

@Entity("patients")
export class PatientEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "uuid", unique: true })
  userId!: string;

  @Column({ name: "clinic_id", type: "uuid" })
  clinicId!: string;

  @Column({ name: "date_of_birth", type: "date", nullable: true })
  dateOfBirth!: Date | null;

  @Column({ name: "insurance_number", type: "varchar", length: 100, nullable: true })
  insuranceNumber!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

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
