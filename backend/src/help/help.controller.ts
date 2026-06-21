import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { HelpService } from './help.service';
import { CreateHelpPostDto, UpdateHelpPostDto, QueryHelpDto, UpdateHelpStatusDto } from './dto/help.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('help')
export class HelpController {
  constructor(private readonly helpService: HelpService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('images', 9, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateHelpPostDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.helpService.create(user.id, dto, files);
  }

  @Get('list')
  findAll(@Query() filters: QueryHelpDto) {
    return this.helpService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.helpService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateHelpPostDto,
  ) {
    return this.helpService.update(+id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.helpService.remove(+id, user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() statusDto: UpdateHelpStatusDto,
  ) {
    return this.helpService.updateStatus(+id, user.id, statusDto);
  }
}
