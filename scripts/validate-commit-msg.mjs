import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const ALLOWED_TYPES = new Set([
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'test',
  'chore',
  'ci',
  'build',
  'perf',
  'revert',
])

const HEADER_PATTERN = /^([a-z]+)\(([a-z0-9]+(?:-[a-z0-9]+)*)\):\s+(.+)$/
const CHINESE_PATTERN = /[\u3400-\u9fff]/

function firstMessageLine(raw) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('#')) ?? ''
}

export function validateCommitMessage(raw) {
  const header = firstMessageLine(raw)
  if (!header) {
    return { valid: false, error: '提交信息不能为空。' }
  }

  const match = header.match(HEADER_PATTERN)
  if (!match) {
    return {
      valid: false,
      error: '提交信息格式必须为 type(module): 中文描述。',
    }
  }

  const [, type, moduleName, description] = match
  if (!ALLOWED_TYPES.has(type)) {
    return {
      valid: false,
      error: `type 不合法：${type}。`,
    }
  }

  if (!moduleName) {
    return { valid: false, error: 'module 不能为空。' }
  }

  const trimmedDescription = description.trim()
  if (!trimmedDescription) {
    return { valid: false, error: '中文描述不能为空。' }
  }

  if (!CHINESE_PATTERN.test(trimmedDescription)) {
    return { valid: false, error: '描述必须包含中文。' }
  }

  return { valid: true }
}

export function validateCommitMessageFile(messageFile) {
  return validateCommitMessage(readFileSync(messageFile, 'utf8'))
}

export function isDirectRun(moduleUrl, argvPath) {
  return !!argvPath && moduleUrl === pathToFileURL(argvPath).href
}

function printHelp(error) {
  console.error(`提交信息不符合规范：${error}`)
  console.error('')
  console.error('要求格式：type(module): 中文描述')
  console.error(`允许 type：${Array.from(ALLOWED_TYPES).join(', ')}`)
  console.error('')
  console.error('示例：')
  console.error('  feat(map): 增加地点筛选')
  console.error('  fix(ai-chat): 修复 AI 回复解析')
  console.error('  docs(plan): 中文化规划文档')
}

if (isDirectRun(import.meta.url, process.argv[1])) {
  const messageFile = process.argv[2]
  if (!messageFile) {
    printHelp('缺少 commit message 文件路径。')
    process.exit(1)
  }

  const result = validateCommitMessageFile(messageFile)
  if (!result.valid) {
    printHelp(result.error)
    process.exit(1)
  }
}
