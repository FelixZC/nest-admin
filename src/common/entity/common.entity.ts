import { ApiHideProperty, ApiProperty } from '@nestjs/swagger'
import { Exclude } from 'class-transformer'
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VirtualColumn,
} from 'typeorm'

// 如果觉得前端转换时间太麻烦，并且不考虑通用性的话，可以在服务端进行转换
// const transformer: ValueTransformer = {
//   to(value) {
//     return value
//   },
//   from(value) {
//     return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
//   },
// }

/**
 * 抽象基类 CommonEntity，提供了最基本的实体属性，如创建时间和更新时间.
 */
export abstract class CommonEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}

/**
 * 抽象基类 CompleteEntity，继承自 CommonEntity，添加了创建者、更新者等属性，以及虚拟列.
 */
export abstract class CompleteEntity extends CommonEntity {
  @ApiHideProperty()
  @Exclude()
  @Column({ name: 'create_by', update: false, comment: '创建者', nullable: true })
  createBy: number

  @ApiHideProperty()
  @Exclude()
  @Column({ name: 'update_by', comment: '更新者', nullable: true })
  updateBy: number

  /**
   * 不会保存到数据库中的虚拟列，数据量大时可能会有性能问题，有性能要求请考虑在 service 层手动实现.
   * @see https://typeorm.io/decorator-reference#virtualcolumn
   */
  @ApiProperty({ description: '创建者' })
  @VirtualColumn({ query: alias => `SELECT username FROM sys_user WHERE id = ${alias}.create_by` })
  creator: string

  @ApiProperty({ description: '更新者' })
  @VirtualColumn({ query: alias => `SELECT username FROM sys_user WHERE id = ${alias}.update_by` })
  updater: string
}
