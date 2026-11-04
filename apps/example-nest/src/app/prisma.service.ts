import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@ts-restless/example-database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
