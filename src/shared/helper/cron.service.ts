import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CronExpression } from '@nestjs/schedule'
import dayjs from 'dayjs'

import { LessThan } from 'typeorm'

import { CronOnce } from '~/common/decorators/cron-once.decorator'
import { ConfigKeyPaths } from '~/config'
import { AccessTokenEntity } from '~/modules/auth/entities/access-token.entity'

/**
 * 提供计划任务服务
 */
@Injectable()
export class CronService {
  private logger: Logger = new Logger(CronService.name)

  /**
   * 构造函数
   * @param configService 配置服务
   */
  constructor(
    private readonly configService: ConfigService<ConfigKeyPaths>,
  ) {}

  /**
   * 每天午夜删除过期的JWT令牌
   * 此方法被CronOnce装饰器标记，以确保一次只有一个实例在执行
   */
  @CronOnce(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteExpiredJWT() {
    this.logger.log('--> 开始扫表，清除过期的 token')

    // 查询所有过期的令牌
    const expiredTokens = await AccessTokenEntity.find({
      where: {
        expired_at: LessThan(new Date()),
      },
    })

    let deleteCount = 0
    // 批量删除过期的令牌
    await Promise.all(
      expiredTokens.map(async (token) => {
        const { value, created_at } = token

        await AccessTokenEntity.remove(token)

        this.logger.debug(
          `--> 删除过期的 token：${value}, 签发于 ${dayjs(created_at).format(
            'YYYY-MM-DD H:mm:ss',
          )}`,
        )

        deleteCount += 1
      }),
    )

    this.logger.log(`--> 删除了 ${deleteCount} 个过期的 token`)
  }
}
