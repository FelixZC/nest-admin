// 导入HttpService以进行HTTP请求
import { HttpService } from '@nestjs/axios'
// 导入Injectable装饰器以标记服务
import { Injectable } from '@nestjs/common'

// 使用Injectable装饰器标记该类为NestJS服务
@Injectable()
export class QQService {
  // 构造函数，注入HttpService
  constructor(private readonly http: HttpService) {}

  /**
   * 根据QQ号获取昵称
   * @param qq QQ号码，可以是字符串或数字
   * @returns 返回一个Promise，解析为包含昵称信息的响应数据
   */
  async getNickname(qq: string | number) {
    // 发起HTTP GET请求，获取QQ用户的昵称信息
    const { data } = await this.http.axiosRef.get(
      `https://users.qzone.qq.com/fcg-bin/cgi_get_portrait.fcg?uins=${qq}`,
    )
    // 返回响应数据
    return data
  }

  /**
   * 根据QQ号获取头像URL
   * @param qq QQ号码，可以是字符串或数字
   * @returns 返回一个包含头像URL的字符串
   */
  async getAvater(qq: string | number) {
    // 构造QQ头像的URL
    return `https://thirdqq.qlogo.cn/g?b=qq&s=100&nk=${qq}`
  }
}
