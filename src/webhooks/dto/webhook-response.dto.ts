export class WebhookResponseDto {
  transactionId!: string;
  userId!: number;
  balance!: number;
  isProcessed!: boolean;
  message?: string;
}
