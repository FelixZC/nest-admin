import {
  ArgumentMetadata, // 用于描述函数参数的元数据
  Inject, // 注入依赖的装饰器
  Injectable, // 标记服务可以被注入
  PipeTransform, // 实现数据转换的管道接口
} from '@nestjs/common'
import { REQUEST } from '@nestjs/core' // 提供请求对象的常量

import { OperatorDto } from '../dto/operator.dto' // 操作者数据传输对象

@Injectable() // 将UpdaterPipe类标记为可注入的服务
export class UpdaterPipe implements PipeTransform {
  constructor(@Inject(REQUEST) private readonly request: any) {
    // 注入请求对象，以便在转换时访问请求相关的数据
  }

  /**
   * 转换操作者数据前，将操作者的UID记录到value中
   * @param value 操作者提交的数据，将被添加额外信息
   * @param metadata 参数元数据，提供关于参数的信息
   * @returns 返回添加了操作者UID的value
   */
  transform(value: OperatorDto, metadata: ArgumentMetadata) {
    const user = this.request.user as IAuthUser // 从请求中获取当前认证用户

    value.updateBy = user.uid // 将操作者的UID赋值给value的updateBy字段

    return value // 返回添加了操作者UID的value
  }
}
