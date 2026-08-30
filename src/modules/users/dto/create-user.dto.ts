import { IsArray, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateUserDto {
  @ApiProperty({ example: 'zhangsan' })
  @IsString()
  @IsNotEmpty()
  username: string

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  password: string

  @ApiProperty({ example: '张三' })
  @IsString()
  @IsNotEmpty()
  realName: string

  @ApiProperty({ example: ['doctor'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  roles: string[]

  @ApiPropertyOptional({ example: '心内科' })
  @IsOptional()
  @IsString()
  department?: string

  @ApiPropertyOptional({ example: '主治医师' })
  @IsOptional()
  @IsString()
  title?: string
}
