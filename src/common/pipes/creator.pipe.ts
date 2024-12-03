import {
  ArgumentMetadata, // 用于描述参数的元数据
  Inject, // 注入依赖的装饰器
  Injectable, // 标记服务可以被注入
  PipeTransform, // 实现数据转换的管道接口
} from '@nestjs/common'
import { REQUEST } from '@nestjs/core' // 提供 REQUEST 常量，用于注入请求对象

import { OperatorDto } from '../dto/operator.dto' // 操作者数据传输对象

@Injectable() // 标记 CreatorPipe 服务可以被注入到其他服务中
export class CreatorPipe implements PipeTransform {
  constructor(@Inject(REQUEST) private readonly request: any) {} // 注入请求对象，以便在管道中访问请求信息

  /**
   * 转换操作者数据，在创建时自动填充创建者信息
   * @param value OperatorDto 实例，包含要转换的数据
   * @param metadata 描述当前参数的元数据，包括参数类型、位置等
   * @returns 返回转换后的 OperatorDto 实例
   */
  transform(value: OperatorDto, metadata: ArgumentMetadata) {
    const user = this.request.user as IAuthUser // 从请求中获取当前认证用户信息

    value.createBy = user.uid // 将用户的唯一标识符作为创建者信息填充到 OperatorDto 中

    return value // 返回填充了创建者信息的 OperatorDto 实例
  }
}
