import { describe, it, expect, vi } from "vitest";
import { UserRole } from "@msp/shared";
import { CreateDoctorUseCase } from "../../../use-cases/doctor/create-doctor.use-case";
import { IUserRepository } from "../../../ports/repositories/user.repository.port";
import { IDoctorRepository } from "../../../ports/repositories/doctor.repository.port";
import { IPasswordHasherPort } from "../../../ports/services";
import { CreateDoctorDTO } from "../../../dtos/doctor.dto";

function createMockUserRepo(
  overrides: Partial<IUserRepository> = {},
): IUserRepository {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockImplementation((user) => Promise.resolve(user)),
    update: vi.fn(),
    ...overrides,
  };
}

function createMockDoctorRepo(
  overrides: Partial<IDoctorRepository> = {},
): IDoctorRepository {
  return {
    findById: vi.fn(),
    findByUserId: vi.fn(),
    findByClinicId: vi.fn(),
    save: vi.fn().mockImplementation((doctor) => Promise.resolve(doctor)),
    update: vi.fn(),
    ...overrides,
  };
}

function createMockPasswordHasher(
  overrides: Partial<IPasswordHasherPort> = {},
): IPasswordHasherPort {
  return {
    hash: vi.fn().mockResolvedValue("hashed-password"),
    verify: vi.fn(),
    ...overrides,
  };
}

function createDto(overrides: Partial<CreateDoctorDTO> = {}): CreateDoctorDTO {
  return {
    clinicId: "clinic-1",
    email: "doctor@test.com",
    password: "SecurePass123!",
    firstName: "Jane",
    lastName: "Smith",
    specialization: "Cardiology",
    slotDurationMin: 30,
    ...overrides,
  };
}

describe("CreateDoctorUseCase", () => {
  it("should create a user and a doctor profile", async () => {
    const userRepo = createMockUserRepo();
    const doctorRepo = createMockDoctorRepo();
    const passwordHasher = createMockPasswordHasher();
    const useCase = new CreateDoctorUseCase(
      userRepo,
      doctorRepo,
      passwordHasher,
    );

    const dto = createDto();
    const result = await useCase.execute(dto, UserRole.CLINIC_ADMIN);

    expect(result.clinicId).toBe("clinic-1");
    expect(result.specialization).toBe("Cardiology");
    expect(result.slotDurationMin).toBe(30);
    expect(result.user.email).toBe("doctor@test.com");
    expect(result.user.firstName).toBe("Jane");
    expect(result.user.lastName).toBe("Smith");
    expect(userRepo.save).toHaveBeenCalledTimes(1);
    expect(doctorRepo.save).toHaveBeenCalledTimes(1);
    expect(passwordHasher.hash).toHaveBeenCalledWith("SecurePass123!");
  });

  it("should reject non-admin users", async () => {
    const userRepo = createMockUserRepo();
    const doctorRepo = createMockDoctorRepo();
    const passwordHasher = createMockPasswordHasher();
    const useCase = new CreateDoctorUseCase(
      userRepo,
      doctorRepo,
      passwordHasher,
    );

    const dto = createDto();

    await expect(useCase.execute(dto, UserRole.DOCTOR)).rejects.toThrow(
      "Only CLINIC_ADMIN can create doctors",
    );

    expect(userRepo.save).not.toHaveBeenCalled();
    expect(doctorRepo.save).not.toHaveBeenCalled();
  });

  it("should throw DuplicateEmailError when email already exists", async () => {
    const userRepo = createMockUserRepo({
      findByEmail: vi.fn().mockResolvedValue({ id: "existing-user" }),
    });
    const doctorRepo = createMockDoctorRepo();
    const passwordHasher = createMockPasswordHasher();
    const useCase = new CreateDoctorUseCase(
      userRepo,
      doctorRepo,
      passwordHasher,
    );

    const dto = createDto();

    await expect(
      useCase.execute(dto, UserRole.CLINIC_ADMIN),
    ).rejects.toThrow("already exists");
  });
});
