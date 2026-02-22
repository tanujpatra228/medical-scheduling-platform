import {
  DataSource,
  UserEntity,
  ClinicEntity,
  DoctorEntity,
  PatientEntity,
  AppointmentEntity,
  AvailabilityRuleEntity,
  AvailabilityOverrideEntity,
  AuditLogEntity,
  RefreshTokenEntity,
} from "@msp/infrastructure";

const TEST_ENTITIES = [
  UserEntity,
  ClinicEntity,
  DoctorEntity,
  PatientEntity,
  AppointmentEntity,
  AvailabilityRuleEntity,
  AvailabilityOverrideEntity,
  AuditLogEntity,
  RefreshTokenEntity,
];

export function createTestDataSource(): DataSource {
  return new DataSource({
    type: "postgres",
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? "msp_user",
    password: process.env.DB_PASSWORD ?? "msp_password",
    database: process.env.DB_NAME ?? "msp_test",
    synchronize: true,
    dropSchema: true,
    entities: TEST_ENTITIES,
    logging: false,
  });
}

export async function truncateAllTables(dataSource: DataSource): Promise<void> {
  const tableNames = dataSource.entityMetadatas
    .map((entity) => `"${entity.tableName}"`)
    .join(", ");

  if (tableNames.length > 0) {
    await dataSource.query(`TRUNCATE TABLE ${tableNames} CASCADE`);
  }
}

export async function seedTestClinic(
  dataSource: DataSource,
  clinicId: string,
): Promise<void> {
  const repo = dataSource.getRepository(ClinicEntity);
  const existing = await repo.findOneBy({ id: clinicId });
  if (!existing) {
    await repo.save({
      id: clinicId,
      name: "Test Clinic",
      slug: "test-clinic",
      address: "123 Test St",
      phone: "555-0100",
      email: "clinic@test.com",
      timezone: "America/New_York",
      isActive: true,
    });
  }
}
