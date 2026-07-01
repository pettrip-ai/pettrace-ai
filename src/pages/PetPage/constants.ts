import type { Pet, PetSize, CareTask, CareTaskType } from '../../data/types'

export type Kind = Pet['kind']
export const KIND_LABEL: Record<Kind, string> = {
  dog: '狗',
  cat: '猫',
  rabbit: '兔',
  hamster: '仓鼠',
  other: '其它',
}

export const SIZE_LABEL: Record<PetSize, string> = {
  large: '大型犬',
  medium: '中型犬',
  small: '小型犬',
}

export const SIZE_OPTIONS: { value: PetSize; label: string }[] = [
  { value: 'large', label: '大型' },
  { value: 'medium', label: '中型' },
  { value: 'small', label: '小型' },
]

export const KIND_OPTIONS: { value: Kind; label: string }[] = [
  { value: 'dog', label: '狗' },
  { value: 'cat', label: '猫' },
  { value: 'rabbit', label: '兔' },
  { value: 'hamster', label: '仓鼠' },
  { value: 'other', label: '其它' },
]

export const TRAIT_OPTIONS = ['温和', '活泼', '胆小', '独立', '亲人', '挑食', '易紧张']

export const CARE_META: Record<
  CareTaskType,
  { label: string; defaultIntervalDays: number; group: 'vaccine' | 'deworm' | 'bath' | 'checkup' | 'other' }
> = {
  vaccine_combined: { label: '联苗（四联/六联）', defaultIntervalDays: 365, group: 'vaccine' },
  rabies: { label: '狂犬疫苗', defaultIntervalDays: 3 * 365, group: 'vaccine' },
  deworm_internal: { label: '体内驱虫', defaultIntervalDays: 90, group: 'deworm' },
  deworm_external: { label: '体外驱虫', defaultIntervalDays: 90, group: 'deworm' },
  bath: { label: '洗澡/美容', defaultIntervalDays: 14, group: 'bath' },
  checkup: { label: '体检', defaultIntervalDays: 180, group: 'checkup' },
  neuter: { label: '绝育', defaultIntervalDays: 0, group: 'other' },
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400_000)
}

export function nextISO(task: CareTask): string {
  const d = new Date(task.lastDoneISO)
  if (task.intervalDays <= 0) return task.lastDoneISO
  d.setDate(d.getDate() + task.intervalDays)
  return d.toISOString()
}

export function dateLabel(iso: string) {
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export function statusChip(task: CareTask) {
  if (task.intervalDays <= 0) {
    return { text: '未设间隔', cls: 'bg-outline-variant text-ink border-outline-variant' }
  }
  const now = new Date()
  const n = new Date(nextISO(task))
  const diffDays = daysBetween(now, n)
  if (diffDays < 0) return { text: `已逾期 ${-diffDays} 天`, cls: 'bg-error/10 text-error border-error/25' }
  if (diffDays <= 7) return { text: diffDays === 0 ? '今天到期' : `即将到期 ${diffDays} 天`, cls: 'bg-honey/15 text-honey-deep border-honey/25' }
  return { text: '无需担心', cls: 'bg-success/10 text-success border-success/25' }
}

export function rulesForSize(size?: PetSize): { good: string[]; bad: string[] } {
  if (size === 'large') {
    return {
      good: ['大型公园草坪', '户外露台（多数餐厅仅户外）', '郊区宠物友好度假村', '景区外围步道'],
      bad: ['室内咖啡馆（多数仅小型）', '商场室内（仅服务犬）', '公共交通客舱'],
    }
  }
  if (size === 'medium') {
    return {
      good: ['公园草坪', '多数餐厅户外座位', '带院酒店', '步道景区'],
      bad: ['精品咖啡馆室内（仅小型）', '空中缆车（非宠物箱）', '部分商场室内'],
    }
  }
  if (size === 'small') {
    return {
      good: ['咖啡馆/餐厅室内', '商场宠物推车专区', '宠物箱乘坐交通', '精品酒店', '室内宠物友好餐厅'],
      bad: ['大型犬开放区', '无人牵绳的狗公园大型犬时段'],
    }
  }
  return { good: ['请先在档案里设置体型，AI 将据此做推荐'], bad: [] }
}

export type PetSaveInput = Omit<Pet, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: string; updatedAt?: string }
