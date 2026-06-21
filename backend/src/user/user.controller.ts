import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UpdateProfileDto, VerifyByPropertyDto } from './dto/user.dto';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    const result = await this.userService.findById(user.id);
    const { password, ...userInfo } = result;
    return userInfo;
  }

  @Put('profile')
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    const result = await this.userService.updateProfile(user.id, dto);
    const { password, ...userInfo } = result;
    return userInfo;
  }

  @Post('verify/idcard')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'idCardFront', maxCount: 1 },
        { name: 'idCardBack', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: join(process.cwd(), 'uploads'),
          filename: (req, file, callback) => {
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            callback(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  async verifyByIdCard(
    @CurrentUser() user: User,
    @UploadedFiles()
    files: {
      idCardFront?: Express.Multer.File[];
      idCardBack?: Express.Multer.File[];
    },
  ) {
    const result = await this.userService.verifyByIdCard(user.id, files);
    const { password, ...userInfo } = result;
    return userInfo;
  }

  @Post('verify/property')
  async verifyByProperty(@CurrentUser() user: User, @Body() dto: VerifyByPropertyDto) {
    const result = await this.userService.verifyByProperty(user.id, dto);
    const { password, ...userInfo } = result;
    return userInfo;
  }
}
