import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common'
import { Observable, throwError, TimeoutError } from 'rxjs'
import { catchError, timeout } from 'rxjs/operators'

@Injectable()
export class TimeoutInterceptor implements NestInterceptor { // 定义一个实现了NestInterceptor接口的类
  constructor(private readonly time: number = 10000) {} // 构造函数，可选参数time定义了超时时间，默认为10秒

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> { // 实现Interceptor接口的intercept方法
    return next.handle().pipe( // 继续处理链中的下一个处理程序，并对结果进行处理
      timeout(this.time), // 设置超时时间，如果在指定时间内没有完成，将抛出TimeoutError
      catchError((err) => { // 捕获处理过程中抛出的错误
        if (err instanceof TimeoutError) // 如果错误是TimeoutError，则将其转换为RequestTimeoutException
          return throwError(() => new RequestTimeoutException('请求超时')) // 抛出RequestTimeoutException异常，提示请求超时

        return throwError(() => err) // 对于其他类型的错误，直接抛出
      }),
    )
  }
}
