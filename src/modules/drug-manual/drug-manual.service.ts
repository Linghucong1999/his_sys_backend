import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FlattenMaps, Model, Types } from 'mongoose'
import { DrugManual, DrugManualDocument } from './schemas/drug-manual.schema'
import { UnknownDrug, UnknownDrugDocument } from './schemas/unknown-drug.schema'

/** 药理词根规则：按药品命名规律推断分类 */
const CATEGORY_RULES: Array<[string, string[]]> = [
  ['抗微生物药', ['头孢', '青霉素', '霉素', '沙星', '西林', '硝唑', '环素', '康唑', '韦林', '卡星', '利福', '异烟肼', '吡嗪酰胺', '乙胺丁醇']],
  ['心血管系统用药', ['地平', '普利', '沙坦', '洛尔', '伐他汀', '贝特', '心酮', '硝酸', '地高辛', '胺碘酮', '氯吡格雷', '替格瑞洛', '沙班', '肝素', '华法林']],
  ['内分泌与代谢用药', ['胰岛素', '格列', '列汀', '列净', '双胍', '甲状腺', '咪唑', '硫氧嘧啶', '泼尼松', '地塞米松', '米松', '膦酸', '骨化醇']],
  ['解热镇痛抗炎药', ['布洛芬', '洛芬', '昔布', '美辛', '芬酸', '对乙酰氨基酚', '塞来']],
  ['麻醉与镇静药', ['西泮', '唑仑', '丙泊酚', '卡因', '芬太尼', '阿曲库铵', '库铵', '右美托咪定']],
  ['神经系统用药', ['西汀', '帕罗', '舍曲', '氟西', '氮平', '哌酮', '利培', '立哌唑', '卡马西平', '丙戊酸', '左乙拉西坦', '多奈哌齐', '美金刚', '左旋多巴', '达利雷生', '唑吡坦', '佐匹克隆', '雷美替胺', '苏沃雷生']],
  ['呼吸系统用药', ['氨溴索', '溴己新', '沙丁', '特布', '孟鲁司', '茶碱', '布地奈德', '福莫特罗', '噻托溴铵', '异丙托']],
  ['消化系统用药', ['拉唑', '替丁', '多潘', '莫沙', '蒙脱', '乳果', '硫糖', '铝碳酸', '甘草酸', '熊去氧胆酸']],
  ['血液系统用药', ['叶酸', '硫酸亚铁', '钴胺', '氨甲环酸', '促红素']],
  ['维生素矿物质与电解质', ['维生素', '葡萄糖酸钙', '葡萄糖酸锌', '氯化钾', '碳酸氢钠', '补液盐', '氯化钠', '葡萄糖注射液', '脂肪乳', '左卡尼汀', '阿法骨化醇']],
  ['抗肿瘤药', ['铂', '紫杉', '他滨', '曲塞', '替尼', '替莫唑', '甲氨蝶呤', '环磷酰胺', '氟尿嘧啶']],
  ['眼科耳鼻喉皮肤用药', ['滴眼', '滴耳', '鼻喷', '软膏', '乳膏', '洗剂', '莫匹罗星']],
  ['抗过敏药', ['氯雷他定', '西替利嗪', '氯苯那敏', '异丙嗪', '酮替芬', '奥洛他定']],
  ['泌尿生殖系统用药', ['坦索罗辛', '特拉唑嗪', '非那雄胺', '西地那非', '他达拉非', '索利那新']],
  ['疫苗与生物制品', ['疫苗', '卡介苗']]
]

@Injectable()
export class DrugManualService {
  constructor(
    @InjectModel(DrugManual.name) private readonly manualModel: Model<DrugManualDocument>,
    @InjectModel(UnknownDrug.name) private readonly unknownModel: Model<UnknownDrugDocument>
  ) {}

  async list(
    keyword?: string,
    source?: string,
    category?: string,
    limit = 500
  ): Promise<FlattenMaps<DrugManualDocument>[]> {
    const filter: Record<string, unknown> = {}
    if (keyword) {
      filter.$or = [
        { drugName: { $regex: keyword, $options: 'i' } },
        { genericName: { $regex: keyword, $options: 'i' } }
      ]
    }
    if (source) filter.source = source
    if (category) filter.category = category
    return this.manualModel.find(filter).sort({ drugName: 1 }).limit(limit).lean().exec()
  }

  async findById(id: string): Promise<DrugManualDocument | null> {
    return this.manualModel.findById(id).exec()
  }

  /** 药理分类列表（去重） */
  async listCategories(): Promise<string[]> {
    const cats = await this.manualModel.distinct('category')
    return cats.filter((c): c is string => typeof c === 'string' && !!c).sort()
  }

  /** 按药理词根规则推断分类 */
  inferCategory(drugName: string): string {
    for (const [category, keywords] of CATEGORY_RULES) {
      if (keywords.some((k) => drugName.includes(k))) return category
    }
    return '其他'
  }

  /** 爬虫/导入批量 upsert（按药名去重更新） */
  async upsertByDrugName(data: Partial<DrugManual>): Promise<DrugManualDocument> {
    if (!data.drugName?.trim()) throw new NotFoundException('缺少药品名称')
    return this.manualModel
      .findOneAndUpdate(
        { drugName: data.drugName },
        { $set: { ...data, source: data.source ?? 'crawl', crawledAt: new Date() } },
        { upsert: true, new: true }
      )
      .exec()
  }

  /** 记录数据库中没有的药品（去重计数） */
  async recordUnknownDrugs(
    items: Array<{
      drug: string
      doctorId?: string
      doctorName?: string
      patientId?: string
      patientName?: string
    }>
  ): Promise<void> {
    for (const item of items) {
      const name = item.drug?.trim()
      if (!name) continue
      const known =
        (await this.manualModel.countDocuments({ drugName: name })) > 0 ||
        (await this.dictionaryDrugCount(name)) > 0
      if (known) continue
      await this.unknownModel.updateOne(
        { drugName: name },
        {
          $inc: { count: 1 },
          $set: {
            doctorId: item.doctorId,
            doctorName: item.doctorName,
            patientName: item.patientName,
            patientId: item.patientId ? new Types.ObjectId(item.patientId) : undefined
          },
          $setOnInsert: { drugName: name }
        },
        { upsert: true }
      )
    }
  }

  private async dictionaryDrugCount(name: string): Promise<number> {
    try {
      const coll = this.manualModel.db.collection('dictionaries')
      return await coll.countDocuments({ category: 'drug', name })
    } catch {
      return 0
    }
  }

  /** 未知药品列表 */
  async listUnknown(): Promise<FlattenMaps<UnknownDrugDocument>[]> {
    return this.unknownModel.find({ status: 'pending' }).sort({ count: -1 }).lean().exec()
  }

  /** 注册新药入库（自动词根分类；未提供 category 时推断） */
  async registerDrug(data: {
    drugName: string
    spec?: string
    category?: string
    fullText?: string
  }): Promise<DrugManualDocument> {
    const name = data.drugName?.trim()
    if (!name) throw new NotFoundException('缺少药品名称')
    const doc = await this.manualModel
      .findOneAndUpdate(
        { drugName: name },
        {
          $set: {
            drugName: name,
            spec: data.spec,
            category: data.category?.trim() || this.inferCategory(name),
            fullText: data.fullText,
            source: 'registered'
          }
        },
        { upsert: true, new: true }
      )
      .exec()
    await this.unknownModel.updateOne({ drugName: name }, { $set: { status: 'registered' } })
    return doc
  }
}
