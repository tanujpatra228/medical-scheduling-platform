import { Appointment, TimeSlot } from "@msp/domain";
import { IAppointmentRepository } from "../../ports/repositories/appointment.repository.port";
import { IDoctorRepository } from "../../ports/repositories/doctor.repository.port";
import { IPatientRepository } from "../../ports/repositories/patient.repository.port";
import {
  BookAppointmentDTO,
  AppointmentResponseDTO,
} from "../../dtos/appointment.dto";
import { toAppointmentResponseDTO } from "./appointment.mapper";

export class SlotAlreadyBookedError extends Error {
  constructor() {
    super("The selected time slot is already booked");
    this.name = "SlotAlreadyBookedError";
  }
}

export class DoctorNotFoundForBookingError extends Error {
  constructor(doctorId: string) {
    super(`Doctor not found: ${doctorId}`);
    this.name = "DoctorNotFoundForBookingError";
  }
}

export class PatientNotFoundForBookingError extends Error {
  constructor(patientId: string) {
    super(`Patient not found: ${patientId}`);
    this.name = "PatientNotFoundForBookingError";
  }
}

export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly doctorRepo: IDoctorRepository,
    private readonly patientRepo: IPatientRepository,
  ) {}

  async execute(dto: BookAppointmentDTO): Promise<AppointmentResponseDTO> {
    const doctor = await this.doctorRepo.findById(dto.clinicId, dto.doctorId);
    if (!doctor) {
      throw new DoctorNotFoundForBookingError(dto.doctorId);
    }

    const patient = await this.patientRepo.findById(
      dto.clinicId,
      dto.patientId,
    );
    if (!patient) {
      throw new PatientNotFoundForBookingError(dto.patientId);
    }

    const overlapping = await this.appointmentRepo.findOverlapping(
      dto.clinicId,
      dto.doctorId,
      dto.startsAt,
      dto.endsAt,
    );
    if (overlapping.length > 0) {
      throw new SlotAlreadyBookedError();
    }

    const timeSlot = TimeSlot.create(dto.startsAt, dto.endsAt);
    const appointment = Appointment.create({
      id: crypto.randomUUID(),
      clinicId: dto.clinicId,
      doctorId: dto.doctorId,
      patientId: dto.patientId,
      timeSlot,
      reason: dto.reason,
    });

    const saved = await this.appointmentRepo.save(appointment);
    return toAppointmentResponseDTO(saved);
  }
}
