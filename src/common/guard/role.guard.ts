import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';

type RequestUser = {
  role?: Role | Role[];
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: RequestUser }>();
    const userRole = user?.role;

    if (!userRole) {
      return false;
    }

    if (Array.isArray(userRole)) {
      return requiredRoles.some((role) => userRole.includes(role));
    }

    return requiredRoles.includes(userRole);
  }
}
