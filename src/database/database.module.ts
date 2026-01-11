import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ObjectionModule } from '@willsoto/nestjs-objection';
import { knexSnakeCaseMappers } from 'objection';
import { User } from './models/user.model';
import { Transaction } from './models/transaction.model';
import { TransactionService } from './transaction.service';

@Global()
@Module({
  imports: [
    ObjectionModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        config: {
          client: 'pg',
          connection: configService.get<string>('database.url'),
          pool: {
            min: configService.get<number>('database.poolMin', 2),
            max: configService.get<number>('database.poolMax', 20),
          },
          ...knexSnakeCaseMappers(),
        },
      }),
    }),
    ObjectionModule.forFeature([User, Transaction]),
  ],
  providers: [TransactionService],
  exports: [ObjectionModule, TransactionService],
})
export class DatabaseModule {}
