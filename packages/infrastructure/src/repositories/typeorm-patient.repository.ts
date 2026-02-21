import { Repository } from "typeorm";
import { PatientEntity } from "../database/entities";
import { PatientMapper } from "../database/mappers";
import { IPatientRepository } from "@msp/application";
import { Patient } from "@msp/domain";

export class TypeOrmPatientRepository implements IPatientRepository {
  constructor(private readonly ormRepository: Repository<PatientEntity>) {}

  async findById(clinicId: string, id: string): Promise<Patient | null> {
    const entity = await this.ormRepository.findOne({
      where: { id, clinicId },
    });

    return entity ? PatientMapper.toDomain(entity) : null;
  }

  async findByUserId(
    clinicId: string,
    userId: string,
  ): Promise<Patient | null> {
    const entity = await this.ormRepository.findOne({
      where: { userId, clinicId },
    });

    return entity ? PatientMapper.toDomain(entity) : null;
  }

  async save(patient: Patient): Promise<Patient> {
    const ormData = PatientMapper.toOrm(patient);
    const savedEntity = await this.ormRepository.save(ormData);

    return PatientMapper.toDomain(savedEntity as PatientEntity);
  }

  async update(patient: Patient): Promise<Patient> {
    const ormData = PatientMapper.toOrm(patient);
    const savedEntity = await this.ormRepository.save(ormData);

    return PatientMapper.toDomain(savedEntity as PatientEntity);
  }
}
