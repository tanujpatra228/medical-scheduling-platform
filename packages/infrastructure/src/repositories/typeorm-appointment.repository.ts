import { Repository } from "typeorm";
import { AppointmentEntity } from "../database/entities";
import { AppointmentMapper } from "../database/mappers";
import { AppointmentFilters, IAppointmentRepository } from "@msp/application";
import { Appointment } from "@msp/domain";
import {
  createPaginatedResult,
  PaginationParams,
  PaginatedResult,
} from "@msp/shared";

export class TypeOrmAppointmentRepository implements IAppointmentRepository {
  constructor(
    private readonly ormRepository: Repository<AppointmentEntity>,
  ) {}

  async findById(
    clinicId: string,
    id: string,
  ): Promise<Appointment | null> {
    const entity = await this.ormRepository.findOne({
      where: { id, clinicId },
    });

    return entity ? AppointmentMapper.toDomain(entity) : null;
  }

  async findByDoctorAndDateRange(
    clinicId: string,
    doctorId: string,
    from: Date,
    to: Date,
  ): Promise<Appointment[]> {
    const entities = await this.ormRepository
      .createQueryBuilder("appointment")
      .where("appointment.clinicId = :clinicId", { clinicId })
      .andWhere("appointment.doctorId = :doctorId", { doctorId })
      .andWhere("appointment.startsAt >= :from", { from })
      .andWhere("appointment.startsAt < :to", { to })
      .orderBy("appointment.startsAt", "ASC")
      .getMany();

    return entities.map(AppointmentMapper.toDomain);
  }

  async findOverlapping(
    clinicId: string,
    doctorId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<Appointment[]> {
    const entities = await this.ormRepository
      .createQueryBuilder("appointment")
      .where("appointment.clinicId = :clinicId", { clinicId })
      .andWhere("appointment.doctorId = :doctorId", { doctorId })
      .andWhere("appointment.startsAt < :endsAt", { endsAt })
      .andWhere("appointment.endsAt > :startsAt", { startsAt })
      .andWhere("appointment.status NOT IN (:...excludedStatuses)", {
        excludedStatuses: ["CANCELLED"],
      })
      .getMany();

    return entities.map(AppointmentMapper.toDomain);
  }

  async findAll(
    clinicId: string,
    filters: AppointmentFilters,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Appointment>> {
    const skip = (pagination.page - 1) * pagination.limit;

    const queryBuilder = this.ormRepository
      .createQueryBuilder("appointment")
      .where("appointment.clinicId = :clinicId", { clinicId });

    if (filters.status) {
      queryBuilder.andWhere("appointment.status = :status", {
        status: filters.status,
      });
    }

    if (filters.doctorId) {
      queryBuilder.andWhere("appointment.doctorId = :doctorId", {
        doctorId: filters.doctorId,
      });
    }

    if (filters.patientId) {
      queryBuilder.andWhere("appointment.patientId = :patientId", {
        patientId: filters.patientId,
      });
    }

    if (filters.fromDate) {
      queryBuilder.andWhere("appointment.startsAt >= :fromDate", {
        fromDate: filters.fromDate,
      });
    }

    if (filters.toDate) {
      queryBuilder.andWhere("appointment.startsAt <= :toDate", {
        toDate: filters.toDate,
      });
    }

    const [entities, total] = await queryBuilder
      .orderBy("appointment.startsAt", "ASC")
      .skip(skip)
      .take(pagination.limit)
      .getManyAndCount();

    const appointments = entities.map(AppointmentMapper.toDomain);

    return createPaginatedResult(appointments, total, pagination);
  }

  async save(appointment: Appointment): Promise<Appointment> {
    const ormData = AppointmentMapper.toOrm(appointment);
    const savedEntity = await this.ormRepository.save(ormData);

    return AppointmentMapper.toDomain(savedEntity as AppointmentEntity);
  }

  async update(appointment: Appointment): Promise<Appointment> {
    const ormData = AppointmentMapper.toOrm(appointment);
    const savedEntity = await this.ormRepository.save(ormData);

    return AppointmentMapper.toDomain(savedEntity as AppointmentEntity);
  }
}
