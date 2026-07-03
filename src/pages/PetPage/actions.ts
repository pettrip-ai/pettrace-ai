import type { CareTask } from '../../data/types'
import type { ToastKind } from '../../components/ui/Toast'

type CareTaskInput = Omit<CareTask, 'id'>
type ShowToast = (message: string, opts?: { kind?: ToastKind; title?: string; duration?: number }) => void

export function createCareTaskSaveHandler(
  addCareTask: (task: CareTaskInput) => void,
  show: ShowToast,
) {
  return (task: CareTaskInput) => {
    addCareTask(task)
    show('已添加', { kind: 'ok' })
  }
}
