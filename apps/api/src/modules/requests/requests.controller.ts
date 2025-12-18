import {
  Controller,
  Post,
  Body,
  Ip,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto';
import { Public } from '@/common/decorators/public.decorator';

@Controller('requests')
export class RequestsController {
  constructor(private requestsService: RequestsService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRequestDto, @Ip() ip: string) {
    return this.requestsService.create(dto, ip);
  }
}
