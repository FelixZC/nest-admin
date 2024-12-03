import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { FastifyRequest } from 'fastify'

import { BusinessException } from '~/common/exceptions/biz.exception'
import { ErrorEnum } from '~/constants/error-code.constant'
import { AuthService } from '~/modules/auth/auth.service'

import { ALLOW_ANON_KEY, PERMISSION_KEY, PUBLIC_KEY, Roles } from '../auth.constant'

/**
 * RBAC守卫，用于检查用户的角色和权限
 * 该守卫实现了一个 NestJS 的 CanActivate 接口，用于确定路由是否可以被激活
 */
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  /**
   * 检查请求是否可以继续
   * @param context 执行上下文，包含请求和路由的信息
   * @returns Promise<boolean> 表示请求是否可以继续
   */
  async canActivate(context: ExecutionContext): Promise<any> {
    // 检查路由是否是公开的，如果是，则无需权限检查
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic)
      return true

    // 获取请求对象
    const request = context.switchToHttp().getRequest<FastifyRequest>()

    const { user } = request
    // 如果用户未登录，则抛出无效登录异常
    if (!user)
      throw new BusinessException(ErrorEnum.INVALID_LOGIN)

    // 检查路由是否允许匿名访问（即允许未登录用户访问）
    const allowAnon = this.reflector.get<boolean>(
      ALLOW_ANON_KEY,
      context.getHandler(),
    )
    if (allowAnon)
      return true

    // 获取路由所需的权限
    const payloadPermission = this.reflector.getAllAndOverride<
      string | string[]
    >(PERMISSION_KEY, [context.getHandler(), context.getClass()])

    // 如果路由没有设置权限，则默认通过
    if (!payloadPermission)
      return true

    // 如果用户是管理员，则放开所有权限
    if (user.roles.includes(Roles.ADMIN))
      return true

    // 获取用户的权限列表
    const allPermissions = await this.authService.getPermissionsCache(user.uid) ?? await this.authService.getPermissions(user.uid)
    // console.log(allPermissions)
    let canNext = false

    // 处理权限字符串
    if (Array.isArray(payloadPermission)) {
      // 只要有一个权限满足即可
      canNext = payloadPermission.every(i => allPermissions.includes(i))
    }

    if (typeof payloadPermission === 'string')
      canNext = allPermissions.includes(payloadPermission)

    // 如果用户没有所需的权限，则抛出无权限异常
    if (!canNext)
      throw new BusinessException(ErrorEnum.NO_PERMISSION)

    return true
  }
}
