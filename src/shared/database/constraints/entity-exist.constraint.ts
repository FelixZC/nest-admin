import { Injectable } from '@nestjs/common'
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'
import { DataSource, ObjectType, Repository } from 'typeorm'

/**
 * 定义验证条件接口
 */
interface Condition {
  entity: ObjectType<any>
  // 如果没有指定字段则使用当前验证的属性作为查询依据
  field?: string
}

/**
 * 查询某个字段的值是否在数据表中存在
 */
@ValidatorConstraint({ name: 'entityItemExist', async: true })
@Injectable()
export class EntityExistConstraint implements ValidatorConstraintInterface {
  constructor(private dataSource: DataSource) {}

  /**
   * 实现验证逻辑
   * @param value 要验证的值
   * @param args 验证参数
   * @returns Promise<boolean> 验证结果
   */
  async validate(value: string, args: ValidationArguments) {
    let repo: Repository<any>

    if (!value)
      return true
    // 默认对比字段是id
    let field = 'id'
    // 通过传入的 entity 获取其 repository
    if ('entity' in args.constraints[0]) {
      // 传入的是对象 可以指定对比字段
      field = args.constraints[0].field ?? 'id'
      repo = this.dataSource.getRepository(args.constraints[0].entity)
    }
    else {
      // 传入的是实体类
      repo = this.dataSource.getRepository(args.constraints[0])
    }
    // 通过查询记录是否存在进行验证
    const item = await repo.findOne({ where: { [field]: value } })
    return !!item
  }

  /**
   * 定义默认错误消息
   * @param args 验证参数
   * @returns string 错误消息
   */
  defaultMessage(args: ValidationArguments) {
    if (!args.constraints[0])
      return 'Model not been specified!'

    return `All instance of ${args.constraints[0].name} must been exists in databse!`
  }
}

/**
 * 数据存在性验证装饰器工厂函数
 * @param entity Entity类或验证条件对象
 * @param validationOptions 验证选项
 */
function IsEntityExist(
  entity: ObjectType<any>,
  validationOptions?: ValidationOptions,
): (object: Record<string, any>, propertyName: string) => void

function IsEntityExist(
  condition: { entity: ObjectType<any>, field?: string },
  validationOptions?: ValidationOptions,
): (object: Record<string, any>, propertyName: string) => void

function IsEntityExist(
  condition: ObjectType<any> | { entity: ObjectType<any>, field?: string },
  validationOptions?: ValidationOptions,
): (object: Record<string, any>, propertyName: string) => void {
  return (object: Record<string, any>, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [condition],
      validator: EntityExistConstraint,
    })
  }
}

export { IsEntityExist }
