import { Repository } from "typeorm";
import { UserEntity } from "../database/entities";
import { UserMapper } from "../database/mappers";
import { IUserRepository } from "@msp/application";
import { User } from "@msp/domain";

export class TypeOrmUserRepository implements IUserRepository {
  constructor(private readonly ormRepository: Repository<UserEntity>) {}

  async findById(clinicId: string, id: string): Promise<User | null> {
    const where: Record<string, string> = { id };
    if (clinicId) {
      where.clinicId = clinicId;
    }

    const entity = await this.ormRepository.findOne({ where });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByEmail(clinicId: string, email: string): Promise<User | null> {
    const entity = await this.ormRepository.findOne({
      where: { email, clinicId },
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findAllByEmail(email: string): Promise<User[]> {
    const entities = await this.ormRepository.find({
      where: { email },
    });

    return entities.map(UserMapper.toDomain);
  }

  async save(user: User): Promise<User> {
    const ormData = UserMapper.toOrm(user);
    const savedEntity = await this.ormRepository.save(ormData);

    return UserMapper.toDomain(savedEntity as UserEntity);
  }

  async update(user: User): Promise<User> {
    const ormData = UserMapper.toOrm(user);
    const savedEntity = await this.ormRepository.save(ormData);

    return UserMapper.toDomain(savedEntity as UserEntity);
  }
}
