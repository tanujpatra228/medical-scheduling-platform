import {
  createDataSource,
  type DatabaseConfig as InfraDbConfig,
  UserEntity,
  ClinicEntity,
  DoctorEntity,
  PatientEntity,
  AppointmentEntity,
  AvailabilityRuleEntity,
  AvailabilityOverrideEntity,
  AuditLogEntity,
  RefreshTokenEntity,
  TypeOrmUserRepository,
  TypeOrmClinicRepository,
  TypeOrmDoctorRepository,
  TypeOrmPatientRepository,
  TypeOrmAppointmentRepository,
  TypeOrmAvailabilityRuleRepository,
  TypeOrmAvailabilityOverrideRepository,
  TypeOrmAuditLogRepository,
  TypeOrmRefreshTokenRepository,
  Argon2PasswordHasher,
  JwtTokenProvider,
} from "@msp/infrastructure";
import {
  RegisterPatientUseCase,
  LoginUseCase,
  RefreshTokenUseCase,
  GetClinicUseCase,
  UpdateClinicUseCase,
  ListDoctorsUseCase,
  GetDoctorUseCase,
  CreateDoctorUseCase,
  GetPatientProfileUseCase,
  UpdatePatientProfileUseCase,
} from "@msp/application";
import { config } from "./config/environment";

export interface Container {
  // Infrastructure
  dataSource: { destroy(): Promise<void> };

  // Auth
  tokenProvider: JwtTokenProvider;
  passwordHasher: Argon2PasswordHasher;

  // Use Cases
  registerPatient: RegisterPatientUseCase;
  login: LoginUseCase;
  refreshToken: RefreshTokenUseCase;
  getClinic: GetClinicUseCase;
  updateClinic: UpdateClinicUseCase;
  listDoctors: ListDoctorsUseCase;
  getDoctor: GetDoctorUseCase;
  createDoctor: CreateDoctorUseCase;
  getPatientProfile: GetPatientProfileUseCase;
  updatePatientProfile: UpdatePatientProfileUseCase;
}

export async function createContainer(): Promise<Container> {
  // 1. Create and initialize the DataSource
  const dbConfig: InfraDbConfig = {
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.name,
    ssl: config.isProduction,
    logging: config.isDevelopment,
  };
  const dataSource = createDataSource(dbConfig);
  await dataSource.initialize();

  // 2. Create repository adapters
  const userRepo = new TypeOrmUserRepository(dataSource.getRepository(UserEntity));
  const clinicRepo = new TypeOrmClinicRepository(dataSource.getRepository(ClinicEntity));
  const doctorRepo = new TypeOrmDoctorRepository(dataSource.getRepository(DoctorEntity));
  const patientRepo = new TypeOrmPatientRepository(dataSource.getRepository(PatientEntity));
  const _appointmentRepo = new TypeOrmAppointmentRepository(dataSource.getRepository(AppointmentEntity));
  const _availabilityRuleRepo = new TypeOrmAvailabilityRuleRepository(dataSource.getRepository(AvailabilityRuleEntity));
  const _availabilityOverrideRepo = new TypeOrmAvailabilityOverrideRepository(dataSource.getRepository(AvailabilityOverrideEntity));
  const _auditLogRepo = new TypeOrmAuditLogRepository(dataSource.getRepository(AuditLogEntity));
  const refreshTokenRepo = new TypeOrmRefreshTokenRepository(dataSource.getRepository(RefreshTokenEntity));

  // 3. Create service adapters
  const passwordHasher = new Argon2PasswordHasher();
  const tokenProvider = new JwtTokenProvider(config.jwt);

  // 4. Create use cases with dependencies injected
  const registerPatient = new RegisterPatientUseCase({
    userRepository: userRepo,
    patientRepository: patientRepo,
    refreshTokenRepository: refreshTokenRepo,
    passwordHasher,
    tokenProvider,
  });

  const login = new LoginUseCase({
    userRepository: userRepo,
    refreshTokenRepository: refreshTokenRepo,
    passwordHasher,
    tokenProvider,
  });

  const refreshToken = new RefreshTokenUseCase({
    userRepository: userRepo,
    refreshTokenRepository: refreshTokenRepo,
    tokenProvider,
  });

  const getClinic = new GetClinicUseCase(clinicRepo);
  const updateClinic = new UpdateClinicUseCase(clinicRepo);

  const listDoctors = new ListDoctorsUseCase(doctorRepo, userRepo);
  const getDoctor = new GetDoctorUseCase(doctorRepo);
  const createDoctor = new CreateDoctorUseCase(userRepo, doctorRepo, passwordHasher);

  const getPatientProfile = new GetPatientProfileUseCase(patientRepo);
  const updatePatientProfile = new UpdatePatientProfileUseCase(patientRepo);

  return {
    dataSource,
    tokenProvider,
    passwordHasher,
    registerPatient,
    login,
    refreshToken,
    getClinic,
    updateClinic,
    listDoctors,
    getDoctor,
    createDoctor,
    getPatientProfile,
    updatePatientProfile,
  };
}
