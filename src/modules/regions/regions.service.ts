import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Region, RegionDocument } from './schemas/region.schema'

interface PcaNode {
  code: string
  name: string
  children?: PcaNode[]
}

// CJS 直接 require：避免 TS import default 在 commonjs 下被 __importDefault 包裹
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pcaRaw = require('china-division/dist/pca-code.json') as PcaNode[] | { default: PcaNode[] }

export interface RegionTreeNode {
  value: string
  label: string
  children?: RegionTreeNode[]
}

@Injectable()
export class RegionsService implements OnModuleInit {
  private treeCache: RegionTreeNode[] | null = null

  constructor(@InjectModel(Region.name) private readonly regionModel: Model<RegionDocument>) {}

  async onModuleInit(): Promise<void> {
    // 集合为空时导入 china-division 行政区划数据（省市区三级）
    const count = await this.regionModel.countDocuments()
    if (count > 0) return
    const docs: Array<Pick<Region, 'code' | 'name' | 'parentCode' | 'level'>> = []
    const walk = (nodes: PcaNode[], parentCode: string | null, level: number): void => {
      for (const n of nodes) {
        docs.push({ code: n.code, name: n.name, parentCode, level })
        if (n.children?.length) walk(n.children, n.code, level + 1)
      }
    }
    const pca = Array.isArray(pcaRaw) ? pcaRaw : (pcaRaw as { default: PcaNode[] }).default
    walk(pca, null, 1)
    await this.regionModel.insertMany(docs)
    this.treeCache = null
  }

  /** 省市区三级树（内存缓存） */
  async getTree(): Promise<RegionTreeNode[]> {
    if (this.treeCache) return this.treeCache
    const all = await this.regionModel.find().sort({ code: 1 }).lean().exec()
    const byParent = new Map<string | null, RegionTreeNode[]>()
    for (const r of all) {
      const node: RegionTreeNode = { value: r.code, label: r.name }
      if (!byParent.has(r.parentCode)) byParent.set(r.parentCode, [])
      byParent.get(r.parentCode)!.push(node)
    }
    const attach = (nodes: RegionTreeNode[]): void => {
      for (const n of nodes) {
        const kids = byParent.get(n.value)
        if (kids?.length) {
          n.children = kids
          attach(kids)
        }
      }
    }
    const roots = byParent.get(null) ?? []
    attach(roots)
    this.treeCache = roots
    return roots
  }
}
