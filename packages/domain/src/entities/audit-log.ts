export interface AuditLogProps {
  id: string;
  clinicId: string;
  appointmentId: string;
  actorId: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export class AuditLog {
  readonly id: string;
  readonly clinicId: string;
  readonly appointmentId: string;
  readonly actorId: string;
  readonly action: string;
  readonly fromStatus?: string;
  readonly toStatus?: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: Date;

  constructor(props: AuditLogProps) {
    this.id = props.id;
    this.clinicId = props.clinicId;
    this.appointmentId = props.appointmentId;
    this.actorId = props.actorId;
    this.action = props.action;
    this.fromStatus = props.fromStatus;
    this.toStatus = props.toStatus;
    this.metadata = props.metadata ? { ...props.metadata } : undefined;
    this.createdAt = props.createdAt;
  }
}
