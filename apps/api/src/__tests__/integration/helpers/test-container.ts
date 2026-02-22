import {
  DataSource,
  UserEntity,
  ClinicEntity,
  DoctorEntity,
  PatientEntity,
  AppointmentEntity,
  AvailabilityRuleEntity,
  AvailabilityOverrideEntity,
  RefreshTokenEntity,
  TypeOrmUserRepository,
  TypeOrmClinicRepository,
  TypeOrmDoctorRepository,
  TypeOrmPatientRepository,
  TypeOrmAppointmentRepository,
  TypeOrmAvailabilityRuleRepository,
  TypeOrmAvailabilityOverrideRepository,
  TypeOrmRefreshTokenRepository,
  Argon2PasswordHasher,
  JwtTokenProvider,
  ConsoleEmailAdapter,
  InMemoryJobQueueAdapter,
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
import type { Container } from "../../../container";
import { TypedEventBus } from "../../../events/event-bus";
import { InProcessEventPublisher } from "../../../events/event-publisher";
import {
  AppointmentCreatedHandler,
  AppointmentConfirmedHandler,
  AppointmentCancelledHandler,
} from "../../../events/handlers";

const TEST_JWT_CONFIG = {
  secret: "test-secret-for-integration-tests",
  expiresIn: "15m",
  refreshExpiresIn: "7d",
};

export function createTestContainer(dataSource: DataSource): Container {
  const userRepo = new TypeOrmUserRepository(dataSource.getRepository(UserEntity));
  const clinicRepo = new TypeOrmClinicRepository(dataSource.getRepository(ClinicEntity));
  const doctorRepo = new TypeOrmDoctorRepository(dataSource.getRepository(DoctorEntity));
  const patientRepo = new TypeOrmPatientRepository(dataSource.getRepository(PatientEntity));
  const appointmentRepo = new TypeOrmAppointmentRepository(dataSource.getRepository(AppointmentEntity));
  const availabilityRuleRepo = new TypeOrmAvailabilityRuleRepository(dataSource.getRepository(AvailabilityRuleEntity));
  const availabilityOverrideRepo = new TypeOrmAvailabilityOverrideRepository(dataSource.getRepository(AvailabilityOverrideEntity));
  const refreshTokenRepo = new TypeOrmRefreshTokenRepository(dataSource.getRepository(RefreshTokenEntity));

  const passwordHasher = new Argon2PasswordHasher();
  const tokenProvider = new JwtTokenProvider(TEST_JWT_CONFIG);
  const emailPort = new ConsoleEmailAdapter();
  const jobQueue = new InMemoryJobQueueAdapter();

  const eventBus = new TypedEventBus();
  const eventPublisher = new InProcessEventPublisher(eventBus);

  eventBus.register("APPOINTMENT_CREATED", new AppointmentCreatedHandler(jobQueue));
  eventBus.register("APPOINTMENT_CONFIRMED", new AppointmentConfirmedHandler(jobQueue));
  eventBus.register("APPOINTMENT_CANCELLED", new AppointmentCancelledHandler(jobQueue));

  const expander = new AvailabilityExpander(availabilityRuleRepo);
  const merger = new OverrideMerger(availabilityOverrideRepo);
  const calculator = new FreeSlotCalculator(appointmentRepo);

  return {
    dataSource,
    jobQueue,
    eventPublisher,
    tokenProvider,
    passwordHasher,

    registerPatient: new RegisterPatientUseCase({
      userRepository: userRepo,
      patientRepository: patientRepo,
      refreshTokenRepository: refreshTokenRepo,
      passwordHasher,
      tokenProvider,
    }),
    login: new LoginUseCase({
      userRepository: userRepo,
      refreshTokenRepository: refreshTokenRepo,
      passwordHasher,
      tokenProvider,
    }),
    refreshToken: new RefreshTokenUseCase({
      userRepository: userRepo,
      refreshTokenRepository: refreshTokenRepo,
      tokenProvider,
    }),

    getClinic: new GetClinicUseCase(clinicRepo),
    updateClinic: new UpdateClinicUseCase(clinicRepo),
    listDoctors: new ListDoctorsUseCase(doctorRepo, userRepo),
    getDoctor: new GetDoctorUseCase(doctorRepo),
    createDoctor: new CreateDoctorUseCase(userRepo, doctorRepo, passwordHasher),
    getPatientProfile: new GetPatientProfileUseCase(patientRepo),
    updatePatientProfile: new UpdatePatientProfileUseCase(patientRepo),

    createAppointment: new CreateAppointmentUseCase(appointmentRepo, doctorRepo, patientRepo, eventPublisher),
    confirmAppointment: new ConfirmAppointmentUseCase(appointmentRepo, eventPublisher),
    cancelAppointment: new CancelAppointmentUseCase(appointmentRepo, eventPublisher),
    completeAppointment: new CompleteAppointmentUseCase(appointmentRepo, eventPublisher),
    getAppointment: new GetAppointmentUseCase(appointmentRepo),
    listAppointments: new ListAppointmentsUseCase(appointmentRepo),
    getAvailableSlots: new GetAvailableSlotsUseCase(doctorRepo, clinicRepo, expander, merger, calculator),
  };
}
