import { Repository, IsNull } from "typeorm";
import { RefreshTokenEntity } from "../database/entities";
import { IRefreshTokenRepository, RefreshToken } from "@msp/application";

export class TypeOrmRefreshTokenRepository
  implements IRefreshTokenRepository
{
  constructor(
    private readonly ormRepository: Repository<RefreshTokenEntity>,
  ) {}

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const entity = await this.ormRepository.findOne({
      where: { tokenHash },
    });

    return entity ? this.toDomain(entity) : null;
  }

  async save(token: RefreshToken): Promise<RefreshToken> {
    const ormData = this.toOrm(token);
    const savedEntity = await this.ormRepository.save(ormData);

    return this.toDomain(savedEntity as RefreshTokenEntity);
  }

  async revokeByUserId(userId: string): Promise<void> {
    await this.ormRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    await this.ormRepository.update({ tokenHash }, { revokedAt: new Date() });
  }

  private toDomain(entity: RefreshTokenEntity): RefreshToken {
    return {
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      revokedAt: entity.revokedAt,
      createdAt: entity.createdAt,
    };
  }

  private toOrm(domain: RefreshToken): Partial<RefreshTokenEntity> {
    return {
      id: domain.id,
      userId: domain.userId,
      tokenHash: domain.tokenHash,
      expiresAt: domain.expiresAt,
      revokedAt: domain.revokedAt,
      createdAt: domain.createdAt,
    };
  }
}
