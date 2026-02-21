import { Repository } from "typeorm";
import { DoctorEntity } from "../database/entities";
import { DoctorMapper } from "../database/mappers";
import { IDoctorRepository } from "@msp/application";
import { Doctor } from "@msp/domain";
import {
  createPaginatedResult,
  PaginationParams,
  PaginatedResult,
} from "@msp/shared";

export class TypeOrmDoctorRepository implements IDoctorRepository {
  constructor(private readonly ormRepository: Repository<DoctorEntity>) {}

  async findById(clinicId: string, id: string): Promise<Doctor | null> {
    const entity = await this.ormRepository.findOne({
      where: { id, clinicId },
    });

    return entity ? DoctorMapper.toDomain(entity) : null;
  }

  async findByUserId(
    clinicId: string,
    userId: string,
  ): Promise<Doctor | null> {
    const entity = await this.ormRepository.findOne({
      where: { userId, clinicId },
    });

    return entity ? DoctorMapper.toDomain(entity) : null;
  }

  async findByClinicId(
    clinicId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Doctor>> {
    const skip = (pagination.page - 1) * pagination.limit;

    const [entities, total] = await this.ormRepository
      .createQueryBuilder("doctor")
      .where("doctor.clinicId = :clinicId", { clinicId })
      .orderBy("doctor.createdAt", "DESC")
      .skip(skip)
      .take(pagination.limit)
      .getManyAndCount();

    const doctors = entities.map(DoctorMapper.toDomain);

    return createPaginatedResult(doctors, total, pagination);
  }

  async save(doctor: Doctor): Promise<Doctor> {
    const ormData = DoctorMapper.toOrm(doctor);
    const savedEntity = await this.ormRepository.save(ormData);

    return DoctorMapper.toDomain(savedEntity as DoctorEntity);
  }

  async update(doctor: Doctor): Promise<Doctor> {
    const ormData = DoctorMapper.toOrm(doctor);
    const savedEntity = await this.ormRepository.save(ormData);

    return DoctorMapper.toDomain(savedEntity as DoctorEntity);
  }
}
