import { Injectable } from '@nestjs/common'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import { isEmpty, isNil } from 'lodash'
import { EntityManager, In, Like, Repository } from 'typeorm'

import { PagerDto } from '~/common/dto/pager.dto'
import { ROOT_ROLE_ID } from '~/constants/system.constant'
import { paginate } from '~/helper/paginate'
import { Pagination } from '~/helper/paginate/pagination'
import { MenuEntity } from '~/modules/system/menu/menu.entity'
import { RoleEntity } from '~/modules/system/role/role.entity'

import { RoleDto, RoleQueryDto, RoleUpdateDto } from './role.dto'

/**
 * 角色服务类，负责处理与角色相关的操作
 */
@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private roleRepository: Repository<RoleEntity>,
    @InjectRepository(MenuEntity)
    private menuRepository: Repository<MenuEntity>,
    @InjectEntityManager() private entityManager: EntityManager,
  ) {}

  /**
   * 列举所有角色，排除超级管理员角色
   * @param page 当前页码
   * @param pageSize 每页大小
   * @returns 返回分页的角色数据
   */
  async findAll({
    page,
    pageSize,
  }: PagerDto): Promise<Pagination<RoleEntity>> {
    return paginate(this.roleRepository, { page, pageSize })
  }

  /**
   * 根据查询条件获取角色列表
   * @param page 当前页码
   * @param pageSize 每页大小
   * @param name 角色名称
   * @param value 角色值
   * @param remark 备注
   * @param status 状态
   * @returns 返回分页的角色数据
   */
  async list({
    page,
    pageSize,
    name,
    value,
    remark,
    status,
  }: RoleQueryDto): Promise<Pagination<RoleEntity>> {
    const queryBuilder = await this.roleRepository
      .createQueryBuilder('role')
      .where({
        ...(name ? { name: Like(`%${name}%`) } : null),
        ...(value ? { value: Like(`%${value}%`) } : null),
        ...(remark ? { remark: Like(`%${remark}%`) } : null),
        ...(!isNil(status) ? { status } : null),
      })

    return paginate<RoleEntity>(queryBuilder, {
      page,
      pageSize,
    })
  }

  /**
   * 根据角色ID获取角色信息
   * @param id 角色ID
   * @returns 返回角色信息和关联的菜单ID列表
   */
  async info(id: number) {
    const info = await this.roleRepository
      .createQueryBuilder('role')
      .where({
        id,
      })
      .getOne()

    const menus = await this.menuRepository.find({
      where: { roles: { id } },
      select: ['id'],
    })

    return { ...info, menuIds: menus.map(m => m.id) }
  }

  /**
   * 删除角色
   * @param id 角色ID
   * @throws 如果尝试删除超级管理员角色，则抛出错误
   */
  async delete(id: number): Promise<void> {
    if (id === ROOT_ROLE_ID)
      throw new Error('不能删除超级管理员')
    await this.roleRepository.delete(id)
  }

  /**
   * 创建新角色
   * @param menuIds 菜单ID列表
   * @param data 角色数据
   * @returns 返回新创建的角色ID
   */
  async create({ menuIds, ...data }: RoleDto): Promise<{ roleId: number }> {
    const role = await this.roleRepository.save({
      ...data,
      menus: menuIds
        ? await this.menuRepository.findBy({ id: In(menuIds) })
        : [],
    })

    return { roleId: role.id }
  }

  /**
   * 更新角色信息
   * @param id 角色ID
   * @param menuIds 菜单ID列表
   * @param data 角色数据
   */
  async update(id, { menuIds, ...data }: RoleUpdateDto): Promise<void> {
    await this.roleRepository.update(id, data)
    await this.entityManager.transaction(async (manager) => {
      const role = await this.roleRepository.findOne({ where: { id } })
      role.menus = menuIds?.length
        ? await this.menuRepository.findBy({ id: In(menuIds) })
        : []
      await manager.save(role)
    })
  }

  /**
   * 根据用户ID查找角色信息
   * @param id 用户ID
   * @returns 返回角色ID列表
   */
  async getRoleIdsByUser(id: number): Promise<number[]> {
    const roles = await this.roleRepository.find({
      where: {
        users: { id },
      },
    })

    if (!isEmpty(roles))
      return roles.map(r => r.id)

    return []
  }

  /**
   * 根据角色ID列表获取角色值列表
   * @param ids 角色ID列表
   * @returns 返回角色值列表
   */
  async getRoleValues(ids: number[]): Promise<string[]> {
    return (
      await this.roleRepository.findBy({
        id: In(ids),
      })
    ).map(r => r.value)
  }

  /**
   * 检查用户是否具有管理员角色
   * @param uid 用户ID
   * @returns 如果用户具有管理员角色，则返回true，否则返回false
   */
  async isAdminRoleByUser(uid: number): Promise<boolean> {
    const roles = await this.roleRepository.find({
      where: {
        users: { id: uid },
      },
    })

    if (!isEmpty(roles)) {
      return roles.some(
        r => r.id === ROOT_ROLE_ID,
      )
    }
    return false
  }

  /**
   * 检查角色列表中是否包含管理员角色
   * @param rids 角色ID列表
   * @returns 如果列表中包含管理员角色，则返回true，否则返回false
   */
  hasAdminRole(rids: number[]): boolean {
    return rids.includes(ROOT_ROLE_ID)
  }

  /**
   * 根据角色ID检查是否有关联用户
   * @param id 角色ID
   * @returns 如果角色有关联用户，则返回true，否则返回false
   */
  async checkUserByRoleId(id: number): Promise<boolean> {
    return this.roleRepository.exist({
      where: {
        users: {
          roles: { id },
        },
      },
    })
  }
}
