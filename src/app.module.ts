import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { PatientsModule } from './modules/patients/patients.module'
import { DictionariesModule } from './modules/dictionaries/dictionaries.module'
import { RbacModule } from './modules/rbac/rbac.module'
import { AuditLogModule } from './modules/audit-log/audit-log.module'
import { OutpatientModule } from './modules/outpatient/outpatient.module'
import { InpatientModule } from './modules/inpatient/inpatient.module'
import { EmrModule } from './modules/emr/emr.module'
import { ConsultationModule } from './modules/consultation/consultation.module'
import { CaModule } from './modules/ca/ca.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { SearchModule } from './modules/search/search.module'
import { SeedModule } from './modules/seed/seed.module'
import { DrugManualModule } from './modules/drug-manual/drug-manual.module'
import { RegionsModule } from './modules/regions/regions.module'

@Module({
  imports: [
    // 环境变量：.env 全局可用
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    // MongoDB 连接（本机单节点副本集 rs0）
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI', 'mongodb://127.0.0.1:27017/his?replicaSet=rs0')
      })
    }),
    // 业务模块
    AuthModule,
    UsersModule,
    PatientsModule,
    DictionariesModule,
    RbacModule,
    AuditLogModule,
    OutpatientModule,
    InpatientModule,
    EmrModule,
    ConsultationModule,
    CaModule,
    DashboardModule,
    SearchModule,
    SeedModule,
    DrugManualModule,
    RegionsModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
