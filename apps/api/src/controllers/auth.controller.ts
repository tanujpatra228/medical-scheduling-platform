import { RequestHandler } from "express";
import {
  RegisterPatientUseCase,
  LoginUseCase,
  RefreshTokenUseCase,
} from "@msp/application";
import type {
  RegisterPatientDTO,
  LoginDTO,
  RefreshTokenDTO,
} from "@msp/application";
import { StatusCodes } from "http-status-codes";

interface ParamsWithClinicId {
  clinicId?: string;
}

export class AuthController {
  constructor(
    private readonly registerPatientUseCase: RegisterPatientUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  register: RequestHandler = async (req, res, next) => {
    try {
      const body = req.validatedBody as RegisterPatientDTO;
      const params = req.validatedParams as ParamsWithClinicId | undefined;
      const result = await this.registerPatientUseCase.execute({
        ...body,
        clinicId: params?.clinicId ?? body.clinicId,
      });
      res.status(StatusCodes.CREATED).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  login: RequestHandler = async (req, res, next) => {
    try {
      const body = req.validatedBody as LoginDTO;
      const result = await this.loginUseCase.execute(body);
      res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  refreshToken: RequestHandler = async (req, res, next) => {
    try {
      const body = req.validatedBody as RefreshTokenDTO;
      const result = await this.refreshTokenUseCase.execute(body);
      res.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
