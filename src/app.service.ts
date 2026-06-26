import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { name: string; status: string } {
    return {
      name: 'People Hub API',
      status: 'ok',
    };
  }
}
