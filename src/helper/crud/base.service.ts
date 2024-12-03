import { NotFoundException } from '@nestjs/common'
import { ObjectLiteral, Repository } from 'typeorm'

import { PagerDto } from '~/common/dto/pager.dto'

import { paginate } from '../paginate'
import { Pagination } from '../paginate/pagination'

/**
 * 基础服务类，提供基于TypeORM的通用CRUD操作
 * @template E 实体类类型，必须是ObjectLiteral的子类
 * @template R 存储库类型，默认为Repository<E>
 */
export class BaseService<E extends ObjectLiteral, R extends Repository<E> = Repository<E>> {
  /**
   * 构造函数，初始化存储库
   * @param repository 实体的存储库实例
   */
  constructor(private repository: R) {
  }

  /**
   * 分页查询实体列表
   * @param {PagerDto} options 分页参数，包括页码和页面大小
   * @returns {Promise<Pagination<E>>} 返回分页后的实体列表
   */
  async list({
    page,
    pageSize,
  }: PagerDto): Promise<Pagination<E>> {
    return paginate(this.repository, { page, pageSize })
  }

  /**
   * 根据ID查找单个实体
   * @param {number} id 实体的唯一标识符
   * @returns {Promise<E>} 返回找到的实体
   * @throws {NotFoundException} 如果未找到实体，则抛出未找到异常
   */
  async findOne(id: number): Promise<E> {
    const item = await this.repository.createQueryBuilder().where({ id }).getOne()
    if (!item)
      throw new NotFoundException('未找到该记录')

    return item
  }

  /**
   * 创建新实体
   * @param {any} dto 待创建实体的数据传输对象
   * @returns {Promise<E>} 返回创建后的实体
   */
  async create(dto: any): Promise<E> {
    return await this.repository.save(dto)
  }

  /**
   * 更新现有实体
   * @param {number} id 实体的唯一标识符
   * @param {any} dto 包含更新信息的数据传输对象
   * @returns {Promise<void>} 无返回值
   */
  async update(id: number, dto: any): Promise<void> {
    await this.repository.update(id, dto)
  }

  /**
   * 删除实体
   * @param {number} id 实体的唯一标识符
   * @returns {Promise<void>} 无返回值
   */
  async delete(id: number): Promise<void> {
    const item = await this.findOne(id)
    await this.repository.remove(item)
  }
}
