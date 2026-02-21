import { describe, it, expect, vi } from "vitest";
import { Doctor, User, Email } from "@msp/domain";
import { UserRole } from "@msp/shared";
import { ListDoctorsUseCase } from "../../../use-cases/doctor/list-doctors.use-case";
import { IDoctorRepository } from "../../../ports/repositories/doctor.repository.port";
import { IUserRepository } from "../../../ports/repositories/user.repository.port";

function createMockDoctor(id: string, userId: string): Doctor {
  return new Doctor({
    id,
    userId,
    clinicId: "clinic-1",
    specialization: "General",
    slotDurationMin: 30,
    maxDailyAppointments: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createMockUser(id: string): User {
  return new User({
    id,
    clinicId: "clinic-1",
    email: Email.create(`${id}@test.com`),
    passwordHash: "hashed",
    firstName: "Dr",
    lastName: id,
    role: UserRole.DOCTOR,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe("ListDoctorsUseCase", () => {
  it("should return paginated doctor response DTOs", async () => {
    const doctor1 = createMockDoctor("doc-1", "user-1");
    const doctor2 = createMockDoctor("doc-2", "user-2");
    const user1 = createMockUser("user-1");
    const user2 = createMockUser("user-2");

    const doctorRepo: IDoctorRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByClinicId: vi.fn().mockResolvedValue({
        data: [doctor1, doctor2],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
      save: vi.fn(),
      update: vi.fn(),
    };

    const userRepo: IUserRepository = {
      findById: vi.fn().mockImplementation((_clinicId: string, id: string) => {
        if (id === "user-1") return Promise.resolve(user1);
        if (id === "user-2") return Promise.resolve(user2);
        return Promise.resolve(null);
      }),
      findByEmail: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
    };

    const useCase = new ListDoctorsUseCase(doctorRepo, userRepo);

    const result = await useCase.execute("clinic-1", { page: 1, limit: 10 });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(1);

    expect(result.data[0].id).toBe("doc-1");
    expect(result.data[0].user.email).toBe("user-1@test.com");
    expect(result.data[1].id).toBe("doc-2");
    expect(result.data[1].user.email).toBe("user-2@test.com");
  });

  it("should return empty results when no doctors exist", async () => {
    const doctorRepo: IDoctorRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByClinicId: vi.fn().mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      }),
      save: vi.fn(),
      update: vi.fn(),
    };

    const userRepo: IUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
    };

    const useCase = new ListDoctorsUseCase(doctorRepo, userRepo);

    const result = await useCase.execute("clinic-1", { page: 1, limit: 10 });

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
