import { IDoctorRepository } from "../../ports/repositories/doctor.repository.port";
import { IUserRepository } from "../../ports/repositories/user.repository.port";
import { DoctorResponseDTO } from "../../dtos/doctor.dto";

export class GetDoctorUseCase {
  constructor(
    private readonly doctorRepo: IDoctorRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(
    clinicId: string,
    doctorId: string,
  ): Promise<DoctorResponseDTO | null> {
    const doctor = await this.doctorRepo.findById(clinicId, doctorId);
    if (!doctor) return null;

    const user = await this.userRepo.findById(clinicId, doctor.userId);
    if (!user) return null;

    return {
      id: doctor.id,
      userId: doctor.userId,
      clinicId: doctor.clinicId,
      specialization: doctor.specialization,
      slotDurationMin: doctor.slotDurationMin,
      maxDailyAppointments: doctor.maxDailyAppointments,
      user: {
        id: user.id,
        email: user.email.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
    };
  }
}
