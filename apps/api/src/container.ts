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
  CreateAppointmentUseCase,
  ConfirmAppointmentUseCase,
  CancelAppointmentUseCase,
  CompleteAppointmentUseCase,
  GetAppointmentUseCase,
  ListAppointmentsUseCase,
  GetAvailableSlotsUseCase,
  AvailabilityExpander,
  OverrideMerger,
  FreeSlotCalculator,
} from "@msp/application";
import { config } from "./config/environment";

export interface Container {
  // Infrastructure
  dataSource: { destroy(): Promise<void> };

  // Auth
  tokenProvider: JwtTokenProvider;
  passwordHasher: Argon2PasswordHasher;

  // Use Cases - Auth
  registerPatient: RegisterPatientUseCase;
  login: LoginUseCase;
  refreshToken: RefreshTokenUseCase;

  // Use Cases - Clinic
  getClinic: GetClinicUseCase;
  updateClinic: UpdateClinicUseCase;

  // Use Cases - Doctor
  listDoctors: ListDoctorsUseCase;
  getDoctor: GetDoctorUseCase;
  createDoctor: CreateDoctorUseCase;

  // Use Cases - Patient
  getPatientProfile: GetPatientProfileUseCase;
  updatePatientProfile: UpdatePatientProfileUseCase;

  // Use Cases - Appointment
  createAppointment: CreateAppointmentUseCase;
  confirmAppointment: ConfirmAppointmentUseCase;
  cancelAppointment: CancelAppointmentUseCase;
  completeAppointment: CompleteAppointmentUseCase;
  getAppointment: GetAppointmentUseCase;
  listAppointments: ListAppointmentsUseCase;

  // Use Cases - Availability
  getAvailableSlots: GetAvailableSlotsUseCase;
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
  const appointmentRepo = new TypeOrmAppointmentRepository(dataSource.getRepository(AppointmentEntity));
  const availabilityRuleRepo = new TypeOrmAvailabilityRuleRepository(dataSource.getRepository(AvailabilityRuleEntity));
  const availabilityOverrideRepo = new TypeOrmAvailabilityOverrideRepository(dataSource.getRepository(AvailabilityOverrideEntity));
  const _auditLogRepo = new TypeOrmAuditLogRepository(dataSource.getRepository(AuditLogEntity));
  const refreshTokenRepo = new TypeOrmRefreshTokenRepository(dataSource.getRepository(RefreshTokenEntity));

  // 3. Create service adapters
  const passwordHasher = new Argon2PasswordHasher();
  const tokenProvider = new JwtTokenProvider(config.jwt);

  // 4. Create calendar services
  const expander = new AvailabilityExpander(availabilityRuleRepo);
  const merger = new OverrideMerger(availabilityOverrideRepo);
  const calculator = new FreeSlotCalculator(appointmentRepo);

  // 5. Create use cases with dependencies injected
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

  // Appointment use cases
  const createAppointment = new CreateAppointmentUseCase(appointmentRepo, doctorRepo, patientRepo);
  const confirmAppointment = new ConfirmAppointmentUseCase(appointmentRepo);
  const cancelAppointment = new CancelAppointmentUseCase(appointmentRepo);
  const completeAppointment = new CompleteAppointmentUseCase(appointmentRepo);
  const getAppointment = new GetAppointmentUseCase(appointmentRepo);
  const listAppointments = new ListAppointmentsUseCase(appointmentRepo);

  // Availability use case
  const getAvailableSlots = new GetAvailableSlotsUseCase(doctorRepo, clinicRepo, expander, merger, calculator);

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
    createAppointment,
    confirmAppointment,
    cancelAppointment,
    completeAppointment,
    getAppointment,
    listAppointments,
    getAvailableSlots,
  };
}
