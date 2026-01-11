import { Controller, Post, Body } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhookTransactionDto, WebhookResponseDto } from './dto';

@Controller('webhook')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('transaction')
  async handleTransaction(@Body() dto: WebhookTransactionDto): Promise<WebhookResponseDto> {
    return this.webhooksService.handleWebhook(dto);
  }
}
