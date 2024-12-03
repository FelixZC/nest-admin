import { ApiProperty } from '@nestjs/swagger' // 用于生成 API 文档的属性描述
import { Expose, Transform } from 'class-transformer' // 用于对象到对象的转换和暴露属性
import { Allow, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator' // 用于类的属性校验

// 定义排序顺序的枚举
export enum Order {
  ASC = 'ASC', // 正序
  DESC = 'DESC', // 倒序
}

// 分页查询的 DTO 类
export class PagerDto<T = any> {
  // API 文档：定义页面的最小值和默认值
  @ApiProperty({ minimum: 1, default: 1 })
  // 页码最小值为 1
  @Min(1)
  // 必须是整数
  @IsInt()
  // 暴露此属性
  @Expose()
  // 始终为可选参数
  @IsOptional({ always: true })
  // 将字符串转换为数字，若未提供则默认为 1
  @Transform(({ value: val }) => (val ? Number.parseInt(val) : 1), {
    toClassOnly: true,
  })
  page?: number

  // API 文档：定义每页数量的范围和默认值
  @ApiProperty({ minimum: 1, maximum: 100, default: 10 })
  // 每页数量最小值为 1
  @Min(1)
  // 每页数量最大值为 100
  @Max(100)
  // 必须是整数
  @IsInt()
  // 暴露此属性
  @Expose()
  // 始终为可选参数
  @IsOptional({ always: true })
  // 将字符串转换为数字，若未提供则默认为 10
  @Transform(({ value: val }) => (val ? Number.parseInt(val) : 10), {
    toClassOnly: true,
  })
  pageSize?: number

  // API 文档：定义排序字段的属性
  @ApiProperty()
  // 必须是字符串
  @IsString()
  // 为可选参数
  @IsOptional()
  field?: string // 排序字段，可以是 T 类型的键

  // API 文档：定义排序方式的属性
  @ApiProperty({ enum: Order })
  // 必须是 Order 枚举类型
  @IsEnum(Order)
  // 为可选参数
  @IsOptional()
  // 将 'asc' 转换为 Order.ASC，其他值转换为 Order.DESC
  @Transform(({ value }) => (value === 'asc' ? Order.ASC : Order.DESC))
  order?: Order // 排序顺序

  // 允许未定义的属性
  @Allow()
  _t?: number
}
