import { Inject, Injectable } from '@nestjs/common'

import { MailerService as NestMailerService } from '@nestjs-modules/mailer'
import dayjs from 'dayjs'

import Redis from 'ioredis'

import { InjectRedis } from '~/common/decorators/inject-redis.decorator'
import { BusinessException } from '~/common/exceptions/biz.exception'
import { AppConfig, IAppConfig } from '~/config'
import { ErrorEnum } from '~/constants/error-code.constant'
import { randomValue } from '~/utils'

/**
 * 提供邮件发送服务的类，包括验证码发送和验证等功能
 */
@Injectable()
export class MailerService {
  constructor(
    @Inject(AppConfig.KEY) private appConfig: IAppConfig,
    @InjectRedis() private redis: Redis,
    private mailerService: NestMailerService,
  ) {}

  /**
   * 记录验证码发送日志，包括验证码本身、发送IP等信息
   * @param to 收件人邮箱
   * @param code 验证码
   * @param ip 发送验证码的IP地址
   */
  async log(to: string, code: string, ip: string) {
    // 计算当天剩余时间，用于设置验证码限制的过期时间
    const getRemainTime = () => {
      const now = dayjs()
      return now.endOf('day').diff(now, 'second')
    }

    // 设置验证码到Redis，有效期为5分钟
    await this.redis.set(`captcha:${to}`, code, 'EX', 60 * 5)

    // 以下代码块用于设置验证码发送的限制，包括IP限制和邮箱限制
    const limitCountOfDay = await this.redis.get(`captcha:${to}:limit-day`)
    const ipLimitCountOfDay = await this.redis.get(`ip:${ip}:send:limit-day`)

    await this.redis.set(`ip:${ip}:send:limit`, 1, 'EX', 60)
    await this.redis.set(`captcha:${to}:limit`, 1, 'EX', 60)
    await this.redis.set(
      `captcha:${to}:send:limit-count-day`,
      limitCountOfDay,
      'EX',
      getRemainTime(),
    )
    await this.redis.set(
      `ip:${ip}:send:limit-count-day`,
      ipLimitCountOfDay,
      'EX',
      getRemainTime(),
    )
  }

  /**
   * 验证码校验，如果验证码不匹配则抛出业务异常
   * @param to 收件人邮箱
   * @param code 用户输入的验证码
   * @throws 如果验证码不正确，抛出BusinessException异常
   */
  async checkCode(to, code) {
    const ret = await this.redis.get(`captcha:${to}`)
    if (ret !== code)
      throw new BusinessException(ErrorEnum.INVALID_VERIFICATION_CODE)

    // 验证码校验通过后，删除Redis中的验证码
    await this.redis.del(`captcha:${to}`)
  }

  /**
   * 检查验证码发送限制，包括IP限制和邮箱接收限制
   * @param to 收件人邮箱
   * @param ip 发送验证码的IP地址
   * @throws 如果达到限制，抛出BusinessException异常
   */
  async checkLimit(to, ip) {
    const LIMIT_TIME = 5

    // IP发送限制检查
    const ipLimit = await this.redis.get(`ip:${ip}:send:limit`)
    if (ipLimit)
      throw new BusinessException(ErrorEnum.TOO_MANY_REQUESTS)

    // 邮箱接收限制检查
    const limit = await this.redis.get(`captcha:${to}:limit`)
    if (limit)
      throw new BusinessException(ErrorEnum.TOO_MANY_REQUESTS)

    // 每天每个邮箱最多接收5条验证码
    let limitCountOfDay: string | number = await this.redis.get(
      `captcha:${to}:limit-day`,
    )
    limitCountOfDay = limitCountOfDay ? Number(limitCountOfDay) : 0
    if (limitCountOfDay > LIMIT_TIME) {
      throw new BusinessException(
        ErrorEnum.MAXIMUM_FIVE_VERIFICATION_CODES_PER_DAY,
      )
    }

    // 每天每个IP最多发送5条验证码
    let ipLimitCountOfDay: string | number = await this.redis.get(
      `ip:${ip}:send:limit-day`,
    )
    ipLimitCountOfDay = ipLimitCountOfDay ? Number(ipLimitCountOfDay) : 0
    if (ipLimitCountOfDay > LIMIT_TIME) {
      throw new BusinessException(
        ErrorEnum.MAXIMUM_FIVE_VERIFICATION_CODES_PER_DAY,
      )
    }
  }

  /**
   * 发送邮件，支持文本和HTML两种格式
   * @param to 收件人邮箱
   * @param subject 邮件主题
   * @param content 邮件内容
   * @param type 邮件内容类型，'text' 或 'html'
   * @returns Promise<any>
   */
  async send(
    to,
    subject,
    content: string,
    type: 'text' | 'html' = 'text',
  ): Promise<any> {
    if (type === 'text') {
      return this.mailerService.sendMail({
        to,
        subject,
        text: content,
      })
    }
    else {
      return this.mailerService.sendMail({
        to,
        subject,
        html: content,
      })
    }
  }

  /**
   * 发送验证码邮件
   * @param to 收件人邮箱
   * @param code 验证码，如果未提供则自动生成
   * @returns Promise<{ to: string, code: string }>
   * @throws 如果邮件发送失败，抛出BusinessException异常
   */
  async sendVerificationCode(to, code = randomValue(4, '1234567890')) {
    const subject = `[${this.appConfig.name}] 验证码`

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template: './verification-code-zh',
        context: {
          code,
        },
      })
    }
    catch (error) {
      console.log(error)
      throw new BusinessException(ErrorEnum.VERIFICATION_CODE_SEND_FAILED)
    }

    return {
      to,
      code,
    }
  }

  // async sendUserConfirmation(user: UserEntity, token: string) {
  //   const url = `example.com/auth/confirm?token=${token}`
  //   await this.mailerService.sendMail({
  //     to: user.email,
  //     subject: 'Confirm your Email',
  //     template: './confirmation',
  //     context: {
  //       name: user.name,
  //       url,
  //     },
  //   })
  // }
}
