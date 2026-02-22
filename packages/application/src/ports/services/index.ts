export interface ICachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
}

export interface IPasswordHasherPort {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

export interface ITokenProviderPort {
  generateAccessToken(payload: {
    userId: string;
    clinicId: string;
    role: string;
  }): string;
  generateRefreshToken(): string;
  verifyAccessToken(
    token: string,
  ): { userId: string; clinicId: string; role: string } | null;
}

export interface IEmailPort {
  send(payload: EmailPayload): Promise<void>;
}

export interface EmailPayload {
  to: string;
  subject: string;
  templateId: string;
  variables: Record<string, string>;
}

export interface IJobQueuePort {
  enqueue(queueName: string, data: Record<string, unknown>): Promise<void>;
  schedule(
    queueName: string,
    data: Record<string, unknown>,
    delayMs: number,
  ): Promise<void>;
}

export interface IEventBusPort {
  publish(event: {
    eventType: string;
    toPayload(): Record<string, unknown>;
  }): Promise<void>;
  register(
    eventType: string,
    handler: (payload: Record<string, unknown>) => Promise<void>,
  ): void;
}

export interface IEventPublisherPort {
  publish(event: {
    eventType: string;
    toPayload(): Record<string, unknown>;
  }): Promise<void>;
}
