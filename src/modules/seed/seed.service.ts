import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Patient, PatientDocument } from '../patients/schemas/patient.schema'
import { Visit, VisitDocument } from '../outpatient/schemas/visit.schema'
import { MedicalRecord, MedicalRecordDocument } from '../emr/schemas/medical-record.schema'
import { Consultation, ConsultationDocument } from '../consultation/schemas/consultation.schema'
import { Bed, BedDocument } from '../inpatient/schemas/bed.schema'
import { InpatientOrder, InpatientOrderDocument } from '../inpatient/schemas/inpatient-order.schema'
import { Dictionary, DictionaryDocument } from '../dictionaries/schemas/dictionary.schema'
import { IdCounterService } from '../id-counter/id-counter.service'
import { User, UserDocument } from '../users/schemas/user.schema'

function daysAgo(days: number, hour = 10, minute = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d
}

/** 演示数据种子：首次启动（患者集合为空）时注入 UI 稿对应的演示数据 */
@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name)

  constructor(
    @InjectModel(Patient.name) private readonly patientModel: Model<PatientDocument>,
    @InjectModel(Visit.name) private readonly visitModel: Model<VisitDocument>,
    @InjectModel(MedicalRecord.name)
    private readonly recordModel: Model<MedicalRecordDocument>,
    @InjectModel(Consultation.name)
    private readonly consultationModel: Model<ConsultationDocument>,
    @InjectModel(Bed.name) private readonly bedModel: Model<BedDocument>,
    @InjectModel(InpatientOrder.name)
    private readonly orderModel: Model<InpatientOrderDocument>,
    @InjectModel(Dictionary.name) private readonly dictionaryModel: Model<DictionaryDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly idCounter: IdCounterService
  ) {}

  async onModuleInit(): Promise<void> {
    const exists = await this.patientModel.countDocuments()
    if (exists > 0) {
      this.logger.log('已存在业务数据，跳过演示数据种子')
      return
    }
    await this.seed()
    // 同步编号计数器：抬升到种子最大序号之后，避免新建档与演示编号冲突
    const d = new Date()
    const p = (n: number): string => String(n).padStart(2, '0')
    const day = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
    await this.idCounter.bump(`mrn:${day}`, 30)
    await this.idCounter.bump(`record:${day}`, 40)
    await this.idCounter.bump('empi', 1)
    this.logger.log('演示数据种子完成（患者/就诊/病历/会诊/床位/医嘱/字典）')
  }

  private async seed(): Promise<void> {
    // 就诊记录归属真实医生账号（患者一览按医生过滤）
    const doctorWang = await this.userModel.findOne({ username: 'D1027' }).exec()
    const doctorId = doctorWang ? String(doctorWang._id) : 'doctor-d1027'
    // ---------- 患者 ----------
    const mk = (
      name: string,
      gender: string,
      age: number,
      phone: string,
      recordNo: string
    ): Promise<PatientDocument> =>
      this.patientModel.create({
        empiId: `P-${name}`,
        name,
        gender,
        birthDate: daysAgo(age * 365, 0, 0),
        phone,
        address: '演示地址',
        medicalRecordNo: recordNo
      })

    const d = new Date()
    const dateStr = (): string => d.toISOString().slice(0, 10).replace(/-/g, '')
    const zh = await mk('张丽华', '女', 45, '13800002671', `DA${dateStr()}012`)
    const wq = await mk('王强', '男', 62, '13900005521', `DA${dateStr()}007`)
    const cj = await mk('陈静', '女', 47, '13700001122', `DA${dateStr()}003`)
    const ljj = await mk('刘建军', '男', 58, '13600003344', 'DA20260828003')
    const zm = await mk('周明', '男', 66, '13500005566', `DA${dateStr()}008`)
    const wf = await mk('吴芳', '女', 39, '13400007788', `DA${dateStr()}009`)
    const zh2 = await mk('郑海', '男', 52, '13300009900', `DA${dateStr()}010`)
    const sl = await mk('孙丽', '女', 61, '13200001010', `DA${dateStr()}011`)
    // 额外复诊患者（补齐今日复诊 11 条，每人仅 1 次）
    const lgh = await mk('李国华', '男', 71, '13100002020', `DA${dateStr()}013`)
    const zl = await mk('周丽', '女', 35, '13000003030', `DA${dateStr()}014`)
    const wgq = await mk('吴国强', '男', 48, '12900004040', `DA${dateStr()}015`)
    const zxh = await mk('郑晓红', '女', 29, '12800005050', `DA${dateStr()}016`)
    const fjj = await mk('冯建军', '男', 55, '12700006060', `DA${dateStr()}017`)

    const patients = [zh, wq, cj, ljj, zm, wf, zh2, sl]

    // ---------- 历史就诊（对齐 UI 稿「复诊调档」次数） ----------
    // 张丽华：3 次就诊（今日 + 08-16 + 03-14）
    await this.visitModel.create({
      visitNo: 'MZ20260816007',
      patientId: zh._id,
      empiId: zh.empiId,
      patientName: zh.name,
      type: 'followup',
      doctorId,
      doctorName: '王医生',
      department: '呼吸内科',
      status: 'completed',
      visitedAt: daysAgo(14, 10, 30)
    })
    await this.visitModel.create({
      visitNo: 'MZ20260314002',
      patientId: zh._id,
      empiId: zh.empiId,
      patientName: zh.name,
      type: 'followup',
      doctorId,
      doctorName: '王医生',
      department: '呼吸内科',
      status: 'completed',
      visitedAt: daysAgo(169, 9, 15)
    })
    // 王强：5 次就诊（今日 + 08-12 + 07-05 + 06-10 + 05-08）
    for (const [no, ago] of [
      ['MZ20260812007', 18],
      ['MZ20260705006', 56],
      ['MZ20260610005', 81],
      ['MZ20260508004', 114]
    ] as Array<[string, number]>) {
      await this.visitModel.create({
        visitNo: no,
        patientId: wq._id,
        empiId: wq.empiId,
        patientName: wq.name,
        type: 'followup',
        doctorId,
        doctorName: '王医生',
        department: '心内科',
        status: 'completed',
        visitedAt: daysAgo(ago, 14, 0)
      })
    }

    // ---------- 今日就诊 18 条（复诊 11 / 首诊 7，全部关联真实患者档案） ----------
    // 张丽华今日 08:52 建档首诊（对齐 UI 稿就诊旅程）
    const zhangToday = new Date()
    zhangToday.setHours(8, 52, 0, 0)
    await this.visitModel.create({
      visitNo: `MZ${zhangToday.toISOString().slice(0, 10).replace(/-/g, '')}012`,
      patientId: zh._id,
      empiId: zh.empiId,
      patientName: zh.name,
      type: 'followup',
      doctorId,
      doctorName: '王医生',
      department: '呼吸内科',
      chiefComplaint: '复诊',
      status: 'in_progress',
      visitedAt: zhangToday
    })

    // 首诊患者：建立真实档案后再创建就诊（保证就诊与档案一一对应）
    const firstNames = ['赵小敏', '钱慧', '孙国栋', '李婉', '周建国', '吴敏', '郑小红']
    const firstPatients: PatientDocument[] = []
    for (let i = 0; i < firstNames.length; i++) {
      firstPatients.push(
        await this.patientModel.create({
          empiId: `P-${firstNames[i]}`,
          name: firstNames[i],
          gender: i % 2 === 0 ? '女' : '男',
          birthDate: daysAgo(20 + i * 4, 0, 0),
          phone: `1390000${String(1000 + i)}`,
          address: '演示地址',
          medicalRecordNo: `DA${dateStr()}${String(18 + i).padStart(4, '0')}`
        })
      )
    }

    const followups = [wq, cj, ljj, wf, sl, lgh, zl, wgq, zxh, fjj]
    let visitSeq = 1
    for (let i = 0; i < 17; i++) {
      const isFollowup = i < 10
      let patient: PatientDocument
      let name: string
      if (isFollowup) {
        patient = followups[i]
        name = patient.name
      } else {
        patient = firstPatients[i - 10]
        name = patient.name
      }
      const d = new Date()
      d.setHours(9 + Math.floor(i / 2), (i % 2) * 30, 0, 0)
      await this.visitModel.create({
        visitNo: `MZ${d.toISOString().slice(0, 10).replace(/-/g, '')}${String(visitSeq++).padStart(4, '0')}`,
        patientId: patient._id,
        empiId: patient.empiId,
        patientName: name,
        type: isFollowup ? 'followup' : 'first',
        doctorId,
        doctorName: '王医生',
        department: '呼吸内科',
        chiefComplaint: isFollowup ? '复诊' : '首诊',
        status: i < 2 ? 'in_progress' : 'completed',
        visitedAt: d
      })
    }

    // ---------- 病历（3 条待签名） ----------
    const mkRecord = (
      no: string,
      type: 'outpatient' | 'admission' | 'prescription',
      p: PatientDocument,
      dept: string,
      doc: string,
      data: Partial<MedicalRecord>,
      signed: boolean,
      at: Date
    ): Promise<MedicalRecordDocument> =>
      this.recordModel.create({
        recordNo: no,
        type,
        patientId: p._id,
        patientName: p.name,
        department: dept,
        doctorName: doc,
        signed,
        signedAt: signed ? at : undefined,
        signedBy: signed ? doc : undefined,
        visitedAt: at,
        ...data
      })

    const today8 = new Date()
    today8.setHours(8, 52, 0, 0)
    await mkRecord(
      `MZ${today8.toISOString().slice(0, 10).replace(/-/g, '')}031`,
      'outpatient',
      zh,
      '呼吸内科',
      '王医生',
      {
        chiefComplaint: '反复咳嗽、咳痰 2 周，加重伴发热 3 天，最高体温 38.4℃。',
        presentIllness:
          '2 周前受凉后出现咳嗽，咳白色黏痰，自服感冒药效果不佳。近 3 天咳嗽加重，伴发热、胸闷，无咯血及呼吸困难。门诊查胸片提示右下肺纹理增粗。',
        pastHistory: '否认高血压、糖尿病史。青霉素过敏。',
        physicalExam: 'T 38.2℃ P 92 次/分 BP 128/82mmHg，右下肺湿啰音。',
        diagnosis: [{ code: 'J15.9', name: '社区获得性肺炎，非重症' }],
        prescriptionSummary: '头孢呋辛钠 1.5g ivgtt bid × 3天；氨溴索口服液 10ml tid × 5天。'
      },
      true,
      new Date(today8.getTime() + 54 * 60000)
    )
    await mkRecord(
      'MZ20260816007',
      'outpatient',
      zh,
      '呼吸内科',
      '王医生',
      {
        chiefComplaint: '咳嗽、咳痰 5 天。',
        diagnosis: [{ code: 'J20.9', name: '急性支气管炎' }],
        prescriptionSummary: '阿莫西林 0.5g tid × 5天；氨溴索口服液 10ml tid × 5天。'
      },
      true,
      daysAgo(14, 10, 30)
    )
    await mkRecord(
      'MZ20260314002',
      'outpatient',
      zh,
      '呼吸内科',
      '王医生',
      {
        chiefComplaint: '发热、咳嗽 3 天。',
        diagnosis: [{ code: 'J15.9', name: '社区获得性肺炎' }],
        prescriptionSummary: '头孢呋辛钠 1.5g ivgtt bid × 5天。'
      },
      true,
      daysAgo(169, 9, 15)
    )
    await mkRecord(
      'MZ20260812007',
      'outpatient',
      wq,
      '心内科',
      '王医生',
      {
        chiefComplaint: '高血压随访，自测血压控制尚可。',
        diagnosis: [{ code: 'I10', name: '原发性高血压' }],
        prescriptionSummary: '硝苯地平缓释片 20mg bid × 30天。'
      },
      false,
      daysAgo(18, 15, 20)
    )
    await mkRecord(
      'MZ20260829031',
      'outpatient',
      cj,
      '内分泌科',
      '王医生',
      {
        chiefComplaint: '体检发现甲状腺结节 1 周。',
        diagnosis: [{ code: 'D34', name: '甲状腺结节' }]
      },
      false,
      daysAgo(1, 16, 2)
    )
    await mkRecord(
      `CF${today8.toISOString().slice(0, 10).replace(/-/g, '')}091`,
      'prescription',
      zh,
      '呼吸内科',
      '王医生',
      {
        prescriptionSummary: '头孢呋辛钠 1.5g ivgtt bid × 3天；氨溴索口服液 10ml tid × 5天。'
      },
      false,
      new Date(today8.getTime() + 38 * 60000)
    )
    await mkRecord(
      'MZ20260810003',
      'outpatient',
      cj,
      '内分泌科',
      '王医生',
      {
        chiefComplaint: '甲状腺结节复查。',
        diagnosis: [{ code: 'D34', name: '甲状腺结节' }]
      },
      true,
      daysAgo(20, 9, 40)
    )
    await mkRecord(
      'ZY20260806001',
      'admission',
      ljj,
      '胸外科',
      '王医生',
      {
        chiefComplaint: '体检发现右上肺占位 1 月。',
        diagnosis: [{ code: 'C34', name: '右上肺占位（待病理）' }]
      },
      true,
      daysAgo(24, 11, 0)
    )

    // ---------- 会诊（2 待响应 / 1 进行中） ----------
    await this.consultationModel.create({
      consultNo: 'CS' + Date.now(),
      patientId: ljj._id,
      patientName: ljj.name,
      patientRef: 'ZY20260828003',
      fromDept: '呼吸内科',
      toDept: '心内科',
      type: 'urgent',
      summary:
        '肺叶切除术后 D2，突发胸闷、心悸，心电图示窦性心动过速 118 次/分，请协助评估心功能及进一步处理。',
      status: 'pending',
      urgeCount: 1
    })
    await this.consultationModel.create({
      consultNo: 'CS' + (Date.now() + 1),
      patientId: zh._id,
      patientName: zh.name,
      patientRef: zh.medicalRecordNo,
      fromDept: '呼吸内科',
      toDept: '影像科',
      type: 'normal',
      summary: '胸片提示右下肺实变影，请影像科读片协助鉴别肺炎与占位性病变，必要时建议增强 CT。',
      status: 'pending'
    })
    await this.consultationModel.create({
      consultNo: 'CS' + (Date.now() + 2),
      patientId: wq._id,
      patientName: wq.name,
      patientRef: wq.medicalRecordNo,
      fromDept: '心内科',
      toDept: '内分泌科',
      type: 'normal',
      summary: '高血压合并血糖异常，请内分泌科协助调整降糖方案。已接受，待出具会诊意见。',
      status: 'accepted',
      respondedAt: daysAgo(1, 14, 20)
    })

    // ---------- 床位 12-19 ----------
    const beds: Array<Partial<Bed> & { patientId?: Types.ObjectId }> = [
      { bedNo: '12 床', status: 'occupied', patientId: ljj._id, patientName: ljj.name, admissionNo: 'ZY20260828003', flag: 'normal', note: '右上肺叶切除术后' },
      { bedNo: '13 床', status: 'occupied', patientId: cj._id, patientName: cj.name, admissionNo: 'ZY20260827001', flag: 'postop', note: '肺结节楔形切除术后' },
      { bedNo: '14 床', status: 'occupied', patientId: zm._id, patientName: zm.name, admissionNo: 'ZY20260825002', flag: 'normal', note: '慢阻肺急性加重' },
      { bedNo: '15 床', status: 'occupied', patientId: wf._id, patientName: wf.name, admissionNo: 'ZY20260822003', flag: 'leaving', note: '肺炎恢复期 · 今日出院' },
      { bedNo: '16 床', status: 'occupied', patientId: zh2._id, patientName: zh2.name, admissionNo: 'ZY20260820004', flag: 'normal', note: '支气管哮喘' },
      { bedNo: '17 床', status: 'occupied', patientId: sl._id, patientName: sl.name, admissionNo: 'ZY20260818005', flag: 'postop', note: '胸腔镜术后' },
      { bedNo: '18 床', status: 'empty', flag: 'normal', note: '已消毒 · 可收治' },
      { bedNo: '19 床', status: 'empty', flag: 'normal', note: '预约明日入院' }
    ]
    for (const b of beds) {
      await this.bedModel.create({ ward: '呼吸内科病区', ...b })
    }

    // ---------- 医嘱（刘建军 12 床） ----------
    await this.orderModel.create({
      patientId: ljj._id,
      bedNo: '12 床',
      type: 'long',
      category: 'drug',
      content: '头孢呋辛钠 1.5g + 0.9% NS 100ml ivgtt',
      frequency: 'q8h · 首次 08-28 16:00',
      status: 'active',
      orderedAt: daysAgo(2, 16, 0)
    })
    await this.orderModel.create({
      patientId: ljj._id,
      bedNo: '12 床',
      type: 'long',
      category: 'drug',
      content: '氨溴索 30mg 雾化吸入',
      frequency: 'tid',
      status: 'active',
      orderedAt: daysAgo(2, 16, 5)
    })
    await this.orderModel.create({
      patientId: ljj._id,
      bedNo: '12 床',
      type: 'long',
      category: 'nursing',
      content: '一级护理 · 心电监护',
      frequency: '持续',
      status: 'active',
      orderedAt: daysAgo(2, 16, 10)
    })
    await this.orderModel.create({
      patientId: ljj._id,
      bedNo: '12 床',
      type: 'temp',
      category: 'exam',
      content: '床旁胸片（复查）',
      frequency: '今日 10:30 已预约',
      status: 'active',
      orderedAt: daysAgo(0, 9, 0)
    })

    // ---------- 字典 ----------
    const dicts: Array<Partial<Dictionary>> = [
      { category: 'icd10', code: 'J15.9', name: '社区获得性肺炎，非重症' },
      { category: 'icd10', code: 'J20.9', name: '急性支气管炎' },
      { category: 'icd10', code: 'I10', name: '原发性高血压' },
      { category: 'icd10', code: 'E11', name: '2型糖尿病' },
      { category: 'icd10', code: 'J44', name: '慢性阻塞性肺疾病急性加重' },
      { category: 'icd10', code: 'J45', name: '支气管哮喘' },
      { category: 'icd10', code: 'C34', name: '肺部恶性肿瘤' },
      { category: 'icd10', code: 'D34', name: '甲状腺结节' },
      { category: 'department', code: 'HX', name: '呼吸内科' },
      { category: 'department', code: 'XNK', name: '心内科' },
      { category: 'department', code: 'YXK', name: '影像科' },
      { category: 'department', code: 'NFM', name: '内分泌科' },
      { category: 'department', code: 'XWK', name: '胸外科' },
      { category: 'department', code: 'PWK', name: '普外科' },
      { category: 'drug', code: 'DRG001', name: '头孢呋辛钠', extra: { spec: '注射用 1.5g' } },
      { category: 'drug', code: 'DRG002', name: '左氧氟沙星', extra: { spec: '注射用 0.5g' } },
      { category: 'drug', code: 'DRG003', name: '氨溴索口服液', extra: { spec: '10ml/支' } },
      { category: 'drug', code: 'DRG004', name: '阿莫西林', extra: { spec: '胶囊 0.5g' } },
      { category: 'drug', code: 'DRG005', name: '布地奈德', extra: { spec: '吸入剂 1mg' } },
      { category: 'drug', code: 'DRG006', name: '硝苯地平缓释片', extra: { spec: '20mg/片' } }
    ]
    await this.dictionaryModel.insertMany(dicts as Dictionary[])
  }
}
