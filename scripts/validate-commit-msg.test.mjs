import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDirectRun, validateCommitMessage, validateCommitMessageFile } from './validate-commit-msg.mjs'

const validMessages = [
  'feat(map): 增加地点筛选',
  'fix(ai-chat): 修复 AI 回复解析',
  'docs(plan): 中文化规划文档',
  'chore(hooks): 增加提交信息校验',
  'ci(github-actions): 增加质量门',
]

const invalidMessages = [
  ['docs: 中文化规划文档', 'missing module'],
  ['docs(plan): update planning docs', 'missing Chinese description'],
  ['other(plan): 中文化规划文档', 'invalid type'],
  ['docs(Plan): 中文化规划文档', 'uppercase module'],
  ['docs(plan) 中文化规划文档', 'missing colon'],
  ['docs(): 中文化规划文档', 'empty module'],
  ['docs(plan): ', 'empty description'],
]

for (const message of validMessages) {
  const result = validateCommitMessage(message)
  assert.equal(result.valid, true, `${message} should be valid`)
}

for (const [message, reason] of invalidMessages) {
  const result = validateCommitMessage(message)
  assert.equal(result.valid, false, `${message} should be invalid: ${reason}`)
  assert.ok(result.error, `${message} should return an error message`)
}

const commentedMessage = [
  '# Please enter the commit message for your changes.',
  '',
  'docs(readme): 更新文档目录',
  '# Lines starting with # are ignored.',
].join('\n')

assert.equal(validateCommitMessage(commentedMessage).valid, true)

const tempDir = mkdtempSync(join(tmpdir(), 'pettrace-commit-msg-'))
const scriptPath = fileURLToPath(new URL('./validate-commit-msg.mjs', import.meta.url))
const scriptUrl = new URL('./validate-commit-msg.mjs', import.meta.url).href

try {
  const validFile = join(tempDir, 'valid-message.txt')
  writeFileSync(validFile, 'docs(plan): 更新规划文档', 'utf8')
  assert.equal(validateCommitMessageFile(validFile).valid, true)

  const invalidFile = join(tempDir, 'invalid-message.txt')
  writeFileSync(invalidFile, 'docs: update planning docs', 'utf8')
  const invalidFileResult = validateCommitMessageFile(invalidFile)
  assert.equal(invalidFileResult.valid, false)
  assert.match(invalidFileResult.error ?? '', /type\(module\): 中文描述/)

  assert.equal(isDirectRun(scriptUrl, scriptPath), true)
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}

console.log('PASS commit message validator')
