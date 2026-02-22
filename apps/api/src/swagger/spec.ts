const UUID_FORMAT = "uuid";
const EMAIL_FORMAT = "email";
const DATETIME_FORMAT = "date-time";

const bearerAuth = [{ BearerAuth: [] }];

const errorResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
    },
  },
});

const jsonContent = (schema: Record<string, unknown>) => ({
  "application/json": { schema },
});

const successResponse = (
  description: string,
  dataSchema: Record<string, unknown>,
) => ({
  description,
  content: jsonContent({
    type: "object",
    required: ["success", "data"],
    properties: {
      success: { type: "boolean", example: true },
      data: dataSchema,
    },
  }),
});

const paginatedResponse = (
  description: string,
  itemSchema: Record<string, unknown>,
) => ({
  description,
  content: jsonContent({
    type: "object",
    required: ["success", "data", "meta"],
    properties: {
      success: { type: "boolean", example: true },
      data: { type: "array", items: itemSchema },
      meta: { $ref: "#/components/schemas/PaginationMeta" },
    },
  }),
});

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Medical Scheduling Platform API",
    version: "1.0.0",
    description:
      "Multi-tenant medical appointment scheduling platform with clinic management, doctor/patient profiles, and availability-based booking.",
  },
  servers: [{ url: "http://localhost:3001", description: "Local development" }],
  tags: [
    { name: "Health", description: "Health check" },
    { name: "Authentication", description: "Register, login, and token refresh" },
    { name: "Clinics", description: "Clinic profile management" },
    { name: "Doctors", description: "Doctor CRUD and listing" },
    { name: "Patients", description: "Patient profile management" },
    { name: "Appointments", description: "Appointment booking and lifecycle" },
    { name: "Availability", description: "Doctor slot availability" },
  ],

  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT access token obtained from /auth/login or /auth/register",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        required: ["success", "error"],
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Invalid input" },
              details: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    path: { type: "string", example: "email" },
                    message: { type: "string", example: "Invalid email" },
                  },
                },
              },
            },
          },
        },
      },
      PaginationMeta: {
        type: "object",
        required: ["total", "page", "limit", "totalPages"],
        properties: {
          total: { type: "integer", example: 42 },
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          totalPages: { type: "integer", example: 3 },
        },
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string", format: UUID_FORMAT },
          email: { type: "string", format: EMAIL_FORMAT },
          firstName: { type: "string", example: "Jane" },
          lastName: { type: "string", example: "Doe" },
          role: { type: "string", enum: ["CLINIC_ADMIN", "DOCTOR", "PATIENT"] },
          clinicId: { type: "string", format: UUID_FORMAT },
        },
      },
      AuthTokens: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
          user: { $ref: "#/components/schemas/AuthUser" },
        },
      },
      Clinic: {
        type: "object",
        properties: {
          id: { type: "string", format: UUID_FORMAT },
          name: { type: "string", example: "Downtown Medical" },
          slug: { type: "string", example: "downtown-medical" },
          address: { type: "string", example: "123 Main St" },
          phone: { type: "string", example: "+1-555-0100" },
          email: { type: "string", format: EMAIL_FORMAT },
          timezone: { type: "string", example: "Europe/Berlin" },
          isActive: { type: "boolean", example: true },
        },
      },
      Doctor: {
        type: "object",
        properties: {
          id: { type: "string", format: UUID_FORMAT },
          userId: { type: "string", format: UUID_FORMAT },
          clinicId: { type: "string", format: UUID_FORMAT },
          specialization: { type: "string", example: "Cardiology" },
          slotDurationMin: { type: "integer", example: 30 },
          maxDailyAppointments: { type: "integer", nullable: true, example: 20 },
        },
      },
      DoctorWithUser: {
        type: "object",
        properties: {
          id: { type: "string", format: UUID_FORMAT },
          userId: { type: "string", format: UUID_FORMAT },
          clinicId: { type: "string", format: UUID_FORMAT },
          specialization: { type: "string", example: "Cardiology" },
          slotDurationMin: { type: "integer", example: 30 },
          maxDailyAppointments: { type: "integer", nullable: true, example: 20 },
          user: {
            type: "object",
            properties: {
              id: { type: "string", format: UUID_FORMAT },
              email: { type: "string", format: EMAIL_FORMAT },
              firstName: { type: "string" },
              lastName: { type: "string" },
              phone: { type: "string", nullable: true },
            },
          },
        },
      },
      Patient: {
        type: "object",
        properties: {
          id: { type: "string", format: UUID_FORMAT },
          userId: { type: "string", format: UUID_FORMAT },
          clinicId: { type: "string", format: UUID_FORMAT },
          dateOfBirth: { type: "string", format: DATETIME_FORMAT, nullable: true },
          insuranceNumber: { type: "string", nullable: true },
          notes: { type: "string", nullable: true },
        },
      },
      Appointment: {
        type: "object",
        properties: {
          id: { type: "string", format: UUID_FORMAT },
          clinicId: { type: "string", format: UUID_FORMAT },
          doctorId: { type: "string", format: UUID_FORMAT },
          patientId: { type: "string", format: UUID_FORMAT },
          startsAt: { type: "string", format: DATETIME_FORMAT },
          endsAt: { type: "string", format: DATETIME_FORMAT },
          status: {
            type: "string",
            enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"],
          },
          reason: { type: "string", nullable: true },
          cancellationReason: { type: "string", nullable: true },
          cancelledBy: { type: "string", nullable: true },
          createdAt: { type: "string", format: DATETIME_FORMAT },
          updatedAt: { type: "string", format: DATETIME_FORMAT },
        },
      },
      Slot: {
        type: "object",
        properties: {
          startsAt: { type: "string", format: DATETIME_FORMAT },
          endsAt: { type: "string", format: DATETIME_FORMAT },
          isAvailable: { type: "boolean" },
        },
      },
    },
  },

  paths: {
    "/api/v1/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        operationId: "getHealth",
        responses: {
          "200": {
            description: "Service is healthy",
            content: jsonContent({
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                timestamp: { type: "string", format: DATETIME_FORMAT },
                uptime: { type: "number", example: 123.45 },
                environment: { type: "string", example: "development" },
              },
            }),
          },
        },
      },
    },

    // ── Authentication ──────────────────────────────────────────────
    "/api/v1/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new patient",
        operationId: "registerPatient",
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            required: ["clinicId", "email", "password", "firstName", "lastName"],
            properties: {
              clinicId: { type: "string", format: UUID_FORMAT },
              email: { type: "string", format: EMAIL_FORMAT },
              password: { type: "string", minLength: 8, maxLength: 128 },
              firstName: { type: "string", minLength: 1, maxLength: 100 },
              lastName: { type: "string", minLength: 1, maxLength: 100 },
              phone: { type: "string" },
              dateOfBirth: { type: "string", format: DATETIME_FORMAT },
              insuranceNumber: { type: "string" },
            },
          }),
        },
        responses: {
          "201": successResponse("Patient registered", {
            $ref: "#/components/schemas/AuthTokens",
          }),
          "400": errorResponse("Validation error"),
          "409": errorResponse("Email already registered"),
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Authenticate and get tokens",
        operationId: "login",
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            required: ["clinicId", "email", "password"],
            properties: {
              clinicId: { type: "string", format: UUID_FORMAT },
              email: { type: "string", format: EMAIL_FORMAT },
              password: { type: "string", minLength: 1 },
            },
          }),
        },
        responses: {
          "200": successResponse("Login successful", {
            $ref: "#/components/schemas/AuthTokens",
          }),
          "401": errorResponse("Invalid credentials"),
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Refresh access token",
        operationId: "refreshToken",
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            required: ["refreshToken"],
            properties: {
              refreshToken: { type: "string", minLength: 1 },
            },
          }),
        },
        responses: {
          "200": successResponse("Token refreshed", {
            $ref: "#/components/schemas/AuthTokens",
          }),
          "401": errorResponse("Invalid or expired refresh token"),
        },
      },
    },

    // ── Clinics ─────────────────────────────────────────────────────
    "/api/v1/clinics/me": {
      get: {
        tags: ["Clinics"],
        summary: "Get current clinic",
        operationId: "getClinic",
        security: bearerAuth,
        responses: {
          "200": successResponse("Clinic details", {
            $ref: "#/components/schemas/Clinic",
          }),
          "401": errorResponse("Unauthorized"),
        },
      },
      patch: {
        tags: ["Clinics"],
        summary: "Update current clinic (CLINIC_ADMIN only)",
        operationId: "updateClinic",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            properties: {
              name: { type: "string", minLength: 1, maxLength: 255 },
              address: { type: "string", minLength: 1 },
              phone: { type: "string", minLength: 1, maxLength: 50 },
              email: { type: "string", format: EMAIL_FORMAT },
              timezone: { type: "string", example: "Europe/Berlin" },
            },
          }),
        },
        responses: {
          "200": successResponse("Clinic updated", {
            $ref: "#/components/schemas/Clinic",
          }),
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Forbidden — requires CLINIC_ADMIN role"),
        },
      },
    },

    // ── Doctors ─────────────────────────────────────────────────────
    "/api/v1/doctors": {
      get: {
        tags: ["Doctors"],
        summary: "List doctors in clinic",
        operationId: "listDoctors",
        security: bearerAuth,
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          "200": paginatedResponse("List of doctors", {
            $ref: "#/components/schemas/Doctor",
          }),
          "401": errorResponse("Unauthorized"),
        },
      },
      post: {
        tags: ["Doctors"],
        summary: "Create a doctor (CLINIC_ADMIN only)",
        operationId: "createDoctor",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            required: [
              "email",
              "password",
              "firstName",
              "lastName",
              "specialization",
              "slotDurationMin",
            ],
            properties: {
              email: { type: "string", format: EMAIL_FORMAT },
              password: { type: "string", minLength: 8, maxLength: 128 },
              firstName: { type: "string", minLength: 1, maxLength: 100 },
              lastName: { type: "string", minLength: 1, maxLength: 100 },
              phone: { type: "string" },
              specialization: { type: "string", minLength: 1, maxLength: 100 },
              slotDurationMin: { type: "integer", minimum: 15, maximum: 120 },
              maxDailyAppointments: { type: "integer", minimum: 1 },
            },
          }),
        },
        responses: {
          "201": successResponse("Doctor created", {
            $ref: "#/components/schemas/DoctorWithUser",
          }),
          "400": errorResponse("Validation error"),
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Forbidden — requires CLINIC_ADMIN role"),
          "409": errorResponse("Email already registered"),
        },
      },
    },
    "/api/v1/doctors/{doctorId}": {
      get: {
        tags: ["Doctors"],
        summary: "Get doctor by ID",
        operationId: "getDoctor",
        security: bearerAuth,
        parameters: [
          {
            name: "doctorId",
            in: "path",
            required: true,
            schema: { type: "string", format: UUID_FORMAT },
          },
        ],
        responses: {
          "200": successResponse("Doctor details", {
            $ref: "#/components/schemas/Doctor",
          }),
          "401": errorResponse("Unauthorized"),
          "404": errorResponse("Doctor not found"),
        },
      },
    },

    // ── Patients ────────────────────────────────────────────────────
    "/api/v1/patients/me": {
      get: {
        tags: ["Patients"],
        summary: "Get patient profile (PATIENT only)",
        operationId: "getPatient",
        security: bearerAuth,
        responses: {
          "200": successResponse("Patient profile", {
            $ref: "#/components/schemas/Patient",
          }),
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Forbidden — requires PATIENT role"),
        },
      },
      patch: {
        tags: ["Patients"],
        summary: "Update patient profile (PATIENT only)",
        operationId: "updatePatient",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            properties: {
              dateOfBirth: { type: "string", format: DATETIME_FORMAT },
              insuranceNumber: { type: "string" },
              notes: { type: "string" },
            },
          }),
        },
        responses: {
          "200": successResponse("Patient updated", {
            $ref: "#/components/schemas/Patient",
          }),
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Forbidden — requires PATIENT role"),
        },
      },
    },

    // ── Appointments ────────────────────────────────────────────────
    "/api/v1/appointments": {
      post: {
        tags: ["Appointments"],
        summary: "Book an appointment",
        operationId: "createAppointment",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: jsonContent({
            type: "object",
            required: ["doctorId", "patientId", "startsAt", "endsAt"],
            properties: {
              doctorId: { type: "string", format: UUID_FORMAT },
              patientId: { type: "string", format: UUID_FORMAT },
              startsAt: { type: "string", format: DATETIME_FORMAT },
              endsAt: { type: "string", format: DATETIME_FORMAT },
              reason: { type: "string", maxLength: 500 },
            },
          }),
        },
        responses: {
          "201": successResponse("Appointment booked", {
            $ref: "#/components/schemas/Appointment",
          }),
          "400": errorResponse("Validation error or time conflict"),
          "401": errorResponse("Unauthorized"),
        },
      },
      get: {
        tags: ["Appointments"],
        summary: "List appointments with filters",
        operationId: "listAppointments",
        security: bearerAuth,
        parameters: [
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"],
            },
          },
          {
            name: "doctorId",
            in: "query",
            schema: { type: "string", format: UUID_FORMAT },
          },
          {
            name: "patientId",
            in: "query",
            schema: { type: "string", format: UUID_FORMAT },
          },
          {
            name: "fromDate",
            in: "query",
            schema: { type: "string", format: DATETIME_FORMAT },
          },
          {
            name: "toDate",
            in: "query",
            schema: { type: "string", format: DATETIME_FORMAT },
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          "200": paginatedResponse("List of appointments", {
            $ref: "#/components/schemas/Appointment",
          }),
          "401": errorResponse("Unauthorized"),
        },
      },
    },
    "/api/v1/appointments/{id}": {
      get: {
        tags: ["Appointments"],
        summary: "Get appointment by ID",
        operationId: "getAppointment",
        security: bearerAuth,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: UUID_FORMAT },
          },
        ],
        responses: {
          "200": successResponse("Appointment details", {
            $ref: "#/components/schemas/Appointment",
          }),
          "401": errorResponse("Unauthorized"),
          "404": errorResponse("Appointment not found"),
        },
      },
    },
    "/api/v1/appointments/{id}/confirm": {
      patch: {
        tags: ["Appointments"],
        summary: "Confirm appointment (CLINIC_ADMIN or DOCTOR)",
        operationId: "confirmAppointment",
        security: bearerAuth,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: UUID_FORMAT },
          },
        ],
        responses: {
          "200": successResponse("Appointment confirmed", {
            $ref: "#/components/schemas/Appointment",
          }),
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Forbidden — requires CLINIC_ADMIN or DOCTOR role"),
          "404": errorResponse("Appointment not found"),
        },
      },
    },
    "/api/v1/appointments/{id}/cancel": {
      patch: {
        tags: ["Appointments"],
        summary: "Cancel appointment",
        operationId: "cancelAppointment",
        security: bearerAuth,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: UUID_FORMAT },
          },
        ],
        requestBody: {
          content: jsonContent({
            type: "object",
            properties: {
              reason: { type: "string", maxLength: 500 },
            },
          }),
        },
        responses: {
          "200": successResponse("Appointment cancelled", {
            $ref: "#/components/schemas/Appointment",
          }),
          "401": errorResponse("Unauthorized"),
          "404": errorResponse("Appointment not found"),
        },
      },
    },
    "/api/v1/appointments/{id}/complete": {
      patch: {
        tags: ["Appointments"],
        summary: "Complete appointment (CLINIC_ADMIN or DOCTOR)",
        operationId: "completeAppointment",
        security: bearerAuth,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: UUID_FORMAT },
          },
        ],
        responses: {
          "200": successResponse("Appointment completed", {
            $ref: "#/components/schemas/Appointment",
          }),
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Forbidden — requires CLINIC_ADMIN or DOCTOR role"),
          "404": errorResponse("Appointment not found"),
        },
      },
    },

    // ── Availability ────────────────────────────────────────────────
    "/api/v1/doctors/{doctorId}/slots": {
      get: {
        tags: ["Availability"],
        summary: "Get available slots for a doctor",
        operationId: "getDoctorSlots",
        security: bearerAuth,
        parameters: [
          {
            name: "doctorId",
            in: "path",
            required: true,
            schema: { type: "string", format: UUID_FORMAT },
          },
          {
            name: "from",
            in: "query",
            required: true,
            schema: { type: "string", format: DATETIME_FORMAT },
            description: "Start of date range (ISO 8601)",
          },
          {
            name: "to",
            in: "query",
            required: true,
            schema: { type: "string", format: DATETIME_FORMAT },
            description: "End of date range (ISO 8601)",
          },
        ],
        responses: {
          "200": successResponse("Available slots", {
            type: "array",
            items: { $ref: "#/components/schemas/Slot" },
          }),
          "401": errorResponse("Unauthorized"),
          "404": errorResponse("Doctor not found"),
        },
      },
    },
  },
} as const;
