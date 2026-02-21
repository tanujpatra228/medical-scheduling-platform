import { Doctor } from "@msp/domain";
import { PaginationParams, PaginatedResult } from "@msp/shared";
import { IDoctorRepository } from "../../ports/repositories/doctor.repository.port";
import { DoctorResponseDTO } from "../../dtos/doctor.dto";
import { IUserRepository } from "../../ports/repositories/user.repository.port";

export class ListDoctorsUseCase {
  constructor(
    private readonly doctorRepo: IDoctorRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(
    clinicId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<DoctorResponseDTO>> {
    const result = await this.doctorRepo.findByClinicId(clinicId, pagination);

    const doctorDtos = await Promise.all(
      result.data.map((doctor) => this.mapToDto(clinicId, doctor)),
    );

    return {
      data: doctorDtos,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  private async mapToDto(
    clinicId: string,
    doctor: Doctor,
  ): Promise<DoctorResponseDTO> {
    const user = await this.userRepo.findById(clinicId, doctor.userId);

    return {
      id: doctor.id,
      userId: doctor.userId,
      clinicId: doctor.clinicId,
      specialization: doctor.specialization,
      slotDurationMin: doctor.slotDurationMin,
      maxDailyAppointments: doctor.maxDailyAppointments,
      user: {
        id: user!.id,
        email: user!.email.toString(),
        firstName: user!.firstName,
        lastName: user!.lastName,
        phone: user!.phone,
      },
    };
  }
}
