import { User, Doctor, Email } from "@msp/domain";
import { UserRole } from "@msp/shared";
import { v4 as uuidv4 } from "uuid";
import { IUserRepository } from "../../ports/repositories/user.repository.port";
import { IDoctorRepository } from "../../ports/repositories/doctor.repository.port";
import { IPasswordHasherPort } from "../../ports/services";
import { CreateDoctorDTO, DoctorResponseDTO } from "../../dtos/doctor.dto";

const DEFAULT_MAX_DAILY_APPOINTMENTS = 20;

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`A user with email "${email}" already exists in this clinic`);
    this.name = "DuplicateEmailError";
  }
}

export class CreateDoctorUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly doctorRepo: IDoctorRepository,
    private readonly passwordHasher: IPasswordHasherPort,
  ) {}

  async execute(dto: CreateDoctorDTO, role: string): Promise<DoctorResponseDTO> {
    if (role !== UserRole.CLINIC_ADMIN) {
      throw new Error("Only CLINIC_ADMIN can create doctors");
    }

    const existingUser = await this.userRepo.findByEmail(
      dto.clinicId,
      dto.email,
    );
    if (existingUser) {
      throw new DuplicateEmailError(dto.email);
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const now = new Date();
    const userId = uuidv4();
    const doctorId = uuidv4();

    const user = new User({
      id: userId,
      clinicId: dto.clinicId,
      email: Email.create(dto.email),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.DOCTOR,
      phone: dto.phone,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const doctor = new Doctor({
      id: doctorId,
      userId: user.id,
      clinicId: dto.clinicId,
      specialization: dto.specialization,
      slotDurationMin: dto.slotDurationMin,
      maxDailyAppointments:
        dto.maxDailyAppointments ?? DEFAULT_MAX_DAILY_APPOINTMENTS,
      createdAt: now,
      updatedAt: now,
    });

    const savedUser = await this.userRepo.save(user);
    const savedDoctor = await this.doctorRepo.save(doctor);

    return {
      id: savedDoctor.id,
      userId: savedUser.id,
      clinicId: savedDoctor.clinicId,
      specialization: savedDoctor.specialization,
      slotDurationMin: savedDoctor.slotDurationMin,
      maxDailyAppointments: savedDoctor.maxDailyAppointments,
      user: {
        id: savedUser.id,
        email: savedUser.email.toString(),
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        phone: savedUser.phone,
      },
    };
  }
}
