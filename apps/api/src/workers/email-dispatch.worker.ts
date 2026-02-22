import type { Job } from "bullmq";
import type {
  IEmailPort,
  IPatientRepository,
  IDoctorRepository,
  IClinicRepository,
  IUserRepository,
} from "@msp/application";

export interface EmailDispatchDeps {
  emailPort: IEmailPort;
  userRepository: IUserRepository;
  patientRepository: IPatientRepository;
  doctorRepository: IDoctorRepository;
  clinicRepository: IClinicRepository;
}

export function createEmailDispatchProcessor(deps: EmailDispatchDeps) {
  return async (job: Job): Promise<void> => {
    const {
      templateId,
      appointmentId,
      clinicId,
      doctorId,
      patientId,
      startsAt,
      cancellationReason,
    } = job.data;

    const patient = await deps.patientRepository.findById(clinicId, patientId);
    if (!patient) {
      console.warn(
        `[EmailDispatch] Patient ${patientId} not found, skipping email for appointment ${appointmentId}`,
      );
      return;
    }

    const patientUser = await deps.userRepository.findById(
      clinicId,
      patient.userId,
    );
    if (!patientUser) {
      console.warn(
        `[EmailDispatch] Patient user ${patient.userId} not found, skipping email for appointment ${appointmentId}`,
      );
      return;
    }

    const doctor = await deps.doctorRepository.findById(clinicId, doctorId);
    if (!doctor) {
      console.warn(
        `[EmailDispatch] Doctor ${doctorId} not found, skipping email for appointment ${appointmentId}`,
      );
      return;
    }

    const doctorUser = await deps.userRepository.findById(
      clinicId,
      doctor.userId,
    );
    if (!doctorUser) {
      console.warn(
        `[EmailDispatch] Doctor user ${doctor.userId} not found, skipping email for appointment ${appointmentId}`,
      );
      return;
    }

    const clinic = await deps.clinicRepository.findById(clinicId);
    if (!clinic) {
      console.warn(
        `[EmailDispatch] Clinic ${clinicId} not found, skipping email for appointment ${appointmentId}`,
      );
      return;
    }

    const appointmentDate = new Date(startsAt);
    const date = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const time = appointmentDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    await deps.emailPort.send({
      to: patientUser.email.toString(),
      subject: "",
      templateId,
      variables: {
        patientName: patientUser.fullName,
        doctorName: doctorUser.fullName,
        date,
        time,
        clinicName: clinic.name,
        ...(cancellationReason ? { reason: cancellationReason } : {}),
      },
    });
  };
}
