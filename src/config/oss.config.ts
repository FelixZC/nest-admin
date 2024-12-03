import { ConfigType, registerAs } from '@nestjs/config'
import * as qiniu from 'qiniu'

import { env } from '~/global/env'

/**
 * 根据字符串标识解析七牛存储区域
 * @param zone 七牛存储区域的字符串标识
 * @returns 返回对应的七牛存储区域对象
 */
function parseZone(zone: string) {
  switch (zone) {
    case 'Zone_as0':
      return qiniu.zone.Zone_as0
    case 'Zone_na0':
      return qiniu.zone.Zone_na0
    case 'Zone_z0':
      return qiniu.zone.Zone_z0
    case 'Zone_z1':
      return qiniu.zone.Zone_z1
    case 'Zone_z2':
      return qiniu.zone.Zone_z2
  }
}

// 定义OSS配置的注册token
export const ossRegToken = 'oss'

/**
 * 注册并返回OSS配置
 * 配置项包括OSS服务的访问密钥、秘密密钥、域名、存储桶名称、存储区域及访问类型
 */
export const OssConfig = registerAs(ossRegToken, () => ({
  accessKey: env('OSS_ACCESSKEY'),
  secretKey: env('OSS_SECRETKEY'),
  domain: env('OSS_DOMAIN'),
  bucket: env('OSS_BUCKET'),
  zone: parseZone(env('OSS_ZONE') || 'Zone_z2'),
  access: (env('OSS_ACCESS_TYPE') as any) || 'public',
}))

// 定义OssConfig的类型别名
export type IOssConfig = ConfigType<typeof OssConfig>
