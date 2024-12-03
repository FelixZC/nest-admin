import FastifyCookie from '@fastify/cookie'
import FastifyMultipart from '@fastify/multipart'
import { FastifyAdapter } from '@nestjs/platform-fastify'

// 创建FastifyAdapter实例作为我们的应用对象
const app: FastifyAdapter = new FastifyAdapter({
  trustProxy: true, // 是否信任代理，默认是false。如果您的应用部署在由反向代理分发请求的环境中，您可能需要将其设置为true。
  logger: false, // 禁用日志记录
  // forceCloseConnections: true, // 此选项可强制在应用关闭时关闭所有连接，这里未启用
})
export { app as fastifyApp }

// 注册FastifyMultipart插件，处理multipart/form-data格式的请求
app.register(FastifyMultipart, {
  limits: {
    fields: 10, // 非文件字段的最大数量
    fileSize: 1024 * 1024 * 6, // 文件大小的限制，单位为字节，这里限制为6MB
    files: 5, // 文件字段的最大数量
  },
})

// 注册FastifyCookie插件，用于处理cookie
app.register(FastifyCookie, {
  secret: 'cookie-secret', // cookie的密钥，用于签名cookie，这里只是一个简单的示例，并非用于安全验证
})

// 添加请求钩子，处理特定的请求条件
app.getInstance().addHook('onRequest', (request, reply, done) => {
  // 如果未定义origin头，则将其设置为host头的值
  const { origin } = request.headers
  if (!origin)
    request.headers.origin = request.headers.host

  // 禁止PHP请求
  const { url } = request
  if (url.endsWith('.php')) {
    reply.raw.statusMessage
      = 'Eh. PHP is not support on this machine. Yep, I also think PHP is bestest programming language. But for me it is beyond my reach.'
    return reply.code(418).send()
  }

  // 跳过favicon和manifest.json的请求
  if (url.match(/favicon.ico$/) || url.match(/manifest.json$/))
    return reply.code(204).send()

  done()
})
