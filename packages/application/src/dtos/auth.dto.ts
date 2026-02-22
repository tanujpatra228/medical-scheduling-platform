export interface LoginDTO {
  readonly clinicId?: string;
  readonly email: string;
  readonly password: string;
}

export interface RegisterPatientDTO {
  readonly clinicId: string;
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string;
  readonly dateOfBirth?: Date;
  readonly insuranceNumber?: string;
}

export interface AuthResponseDTO {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly role: string;
    readonly clinicId: string;
  };
}

export interface RefreshTokenDTO {
  readonly refreshToken: string;
}
