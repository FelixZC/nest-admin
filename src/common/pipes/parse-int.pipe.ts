import {
  ArgumentMetadata, // 用于获取参数元数据的接口
  BadRequestException, // 用于抛出错误的异常类
  Injectable, // 用于注入当前类的装饰器
  PipeTransform, // 用于实现数据转换的接口
} from '@nestjs/common' // NestJS框架提供的常用工具包

/**
 * 将字符串参数转换为数字的管道类
 * 该类通过注入的方式提供转换服务
 */
@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  /**
   * 将字符串值转换为数字
   * 如果转换失败，抛出BadRequestException异常
   *
   * @param value 待转换的字符串值
   * @param metadata 参数元数据，用于调试和错误信息
   * @returns 转换后的数字值
   */
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = Number.parseInt(value, 10) // 尝试将字符串转换为十进制数

    if (Number.isNaN(val))
      throw new BadRequestException('id validation failed') // 如果转换结果不是数字，抛出异常

    return val // 返回转换后的数字
  }
}
