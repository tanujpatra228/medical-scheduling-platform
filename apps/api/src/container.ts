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
  ConsoleEmailAdapter,
  NodemailerEmailAdapter,
  BullMQJobQueueAdapter,
  BullMQWorkerRegistry,
  InMemoryJobQueueAdapter,
  QUEUE_NAMES,
} from "@msp/infrastructure";
import type { IEmailPort, IJobQueuePort, IEventPublisherPort, IPatientRepository } from "@msp/application";
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
import { TypedEventBus } from "./events/event-bus";
import { InProcessEventPublisher, type IEventPublisher } from "./events/event-publisher";
import {
  AppointmentCreatedHandler,
  AppointmentConfirmedHandler,
  AppointmentCancelledHandler,
} from "./events/handlers";
import {
  createEmailDispatchProcessor,
  createReminderProcessor,
} from "./workers";

export interface Container {
  // Infrastructure
  dataSource: { destroy(): Promise<void> };
  jobQueue: IJobQueuePort & { close?(): Promise<void> };
  workerRegistry?: BullMQWorkerRegistry;
  eventPublisher: IEventPublisherPort;

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

  // Repositories (exposed for controllers that need direct repo access)
  patientRepo: IPatientRepository;

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

  // 4. Create email adapter
  let emailPort: IEmailPort;
  if (config.isProduction) {
    emailPort = new NodemailerEmailAdapter(config.smtp);
  } else {
    emailPort = new ConsoleEmailAdapter();
  }

  // 5. Create job queue adapter
  let jobQueue: IJobQueuePort & { close?(): Promise<void> };
  let workerRegistry: BullMQWorkerRegistry | undefined;

  if (config.isTest) {
    jobQueue = new InMemoryJobQueueAdapter();
  } else {
    const bullmqQueue = new BullMQJobQueueAdapter({
      host: config.redis.host,
      port: config.redis.port,
    });
    jobQueue = bullmqQueue;

    // Create worker registry and register processors
    workerRegistry = new BullMQWorkerRegistry({
      host: config.redis.host,
      port: config.redis.port,
    });

    workerRegistry.registerWorker(
      QUEUE_NAMES.EMAIL_DISPATCH,
      createEmailDispatchProcessor({
        emailPort,
        userRepository: userRepo,
        patientRepository: patientRepo,
        doctorRepository: doctorRepo,
        clinicRepository: clinicRepo,
      }),
    );

    workerRegistry.registerWorker(
      QUEUE_NAMES.APPOINTMENT_REMINDERS,
      createReminderProcessor({
        appointmentRepository: appointmentRepo,
        jobQueue: bullmqQueue,
      }),
    );
  }

  // 6. Create event bus and publisher
  const eventBus = new TypedEventBus();
  const eventPublisher = new InProcessEventPublisher(eventBus);

  // Register event handlers
  eventBus.register(
    "APPOINTMENT_CREATED",
    new AppointmentCreatedHandler(jobQueue),
  );
  eventBus.register(
    "APPOINTMENT_CONFIRMED",
    new AppointmentConfirmedHandler(jobQueue),
  );
  eventBus.register(
    "APPOINTMENT_CANCELLED",
    new AppointmentCancelledHandler(jobQueue),
  );

  // 7. Create calendar services
  const expander = new AvailabilityExpander(availabilityRuleRepo);
  const merger = new OverrideMerger(availabilityOverrideRepo);
  const calculator = new FreeSlotCalculator(appointmentRepo);

  // 8. Create use cases with dependencies injected
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

  // Appointment use cases (with event publisher)
  const createAppointment = new CreateAppointmentUseCase(appointmentRepo, doctorRepo, patientRepo, eventPublisher);
  const confirmAppointment = new ConfirmAppointmentUseCase(appointmentRepo, eventPublisher);
  const cancelAppointment = new CancelAppointmentUseCase(appointmentRepo, eventPublisher);
  const completeAppointment = new CompleteAppointmentUseCase(appointmentRepo, eventPublisher);
  const getAppointment = new GetAppointmentUseCase(appointmentRepo);
  const listAppointments = new ListAppointmentsUseCase(appointmentRepo);

  // Availability use case
  const getAvailableSlots = new GetAvailableSlotsUseCase(doctorRepo, clinicRepo, expander, merger, calculator);

  return {
    dataSource,
    jobQueue,
    workerRegistry,
    eventPublisher,
    tokenProvider,
    passwordHasher,
    patientRepo,
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
