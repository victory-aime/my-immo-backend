import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserSession } from '@thallesp/nestjs-better-auth';

@Injectable()
export class MiddlewareGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const session = request.session as UserSession;

    if (!session?.user) {
      throw new ForbiddenException('No session user found');
    }

    const userRole: string | string[] = session.user.role!;

    const hasRole = requiredRoles.includes(userRole as string);

    if (!hasRole) {
      throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}

export const ROLES_KEY = 'roles';

export const AuthorizeRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
