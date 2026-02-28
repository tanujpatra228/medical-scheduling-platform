import { UserRole } from "@msp/shared";
import { IDoctorRepository } from "../../ports/repositories/doctor.repository.port";
import { IUserRepository } from "../../ports/repositories/user.repository.port";
import { UpdateDoctorDTO, DoctorResponseDTO } from "../../dtos/doctor.dto";

export class UpdateDoctorUseCase {
  constructor(
    private readonly doctorRepo: IDoctorRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(
    clinicId: string,
    doctorId: string,
    dto: UpdateDoctorDTO,
    role: string,
  ): Promise<DoctorResponseDTO> {
    if (role !== UserRole.CLINIC_ADMIN) {
      throw new Error("Only CLINIC_ADMIN can update doctors");
    }

    const doctor = await this.doctorRepo.findById(clinicId, doctorId);
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const user = await this.userRepo.findById(clinicId, doctor.userId);
    if (!user) {
      throw new Error("Associated user not found");
    }

    doctor.updateProfile({
      specialization: dto.specialization,
      slotDurationMin: dto.slotDurationMin,
      maxDailyAppointments: dto.maxDailyAppointments,
    });

    user.updateProfile({
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
    });

    const savedDoctor = await this.doctorRepo.update(doctor);
    const savedUser = await this.userRepo.update(user);

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
