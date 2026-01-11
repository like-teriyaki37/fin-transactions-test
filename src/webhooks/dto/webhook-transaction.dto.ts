import { IsInt, IsNotEmpty, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../../common/constants';

export class WebhookTransactionDto {
  @IsInt()
  @Type(() => Number)
  userId!: number;

  @IsString()
  @IsNotEmpty()
  externalId!: string;

  @IsString()
  @IsNotEmpty()
  providerId!: string;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  amount!: number;
}
