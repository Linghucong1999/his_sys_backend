import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreatePatientDto {
  @ApiProperty({ example: '张三' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiPropertyOptional({ enum: ['男', '女', '未知'], example: '男' })
  @IsOptional()
  @IsIn(['男', '女', '未知'])
  gender?: string

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  birthDate?: string

  @ApiPropertyOptional({ example: '110101199001011234' })
  @IsOptional()
  @IsString()
  idCardNo?: string

  @ApiPropertyOptional({ example: '13800000000' })
  @IsOptional()
  @IsString()
  phone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  medicalRecordNo?: string

  @ApiPropertyOptional({
    enum: ['市职工医保', '城乡居民医保', '新农合', '商业保险', '自费'],
    example: '市职工医保'
  })
  @IsOptional()
  @IsIn(['市职工医保', '城乡居民医保', '新农合', '商业保险', '自费'])
  insuranceType?: string
}
