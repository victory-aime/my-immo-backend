import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenExtractorService } from '../config/services';

@Injectable()
export class MiddlewareGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenExtractor: TokenExtractorService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest();
    const user = await this.tokenExtractor.extractUserFromRequest(request);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const userRoles: string[] = Array.isArray(user.role)
      ? user.role
      : [user.role];

    const hasRole = requiredRoles.some((r) => userRoles.includes(r));

    if (!hasRole) {
      throw new ForbiddenException(
        `Accès refusé : rôle requis (${requiredRoles.join(', ')})`,
      );
    }

    return true;
  }
}

export const AuthorizeRoles = (...roles: string[]) =>
  SetMetadata('roles', roles);
