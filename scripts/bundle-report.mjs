import { existsSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const distDir = fileURLToPath(new URL('../dist', import.meta.url))

const budgets = {
  largestJsBytes: 700 * 1024,
  largestCssBytes: 120 * 1024,
  totalBytes: 3 * 1024 * 1024,
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MiB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${bytes} B`
}

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolute = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolute))
    } else if (entry.isFile()) {
      const info = await stat(absolute)
      files.push({
        path: relative(distDir, absolute).replaceAll('\\', '/'),
        ext: extname(entry.name),
        bytes: info.size,
      })
    }
  }
  return files
}

if (!existsSync(distDir)) {
  console.error('dist/ 不存在。请先运行 npm run build。')
  process.exit(1)
}

const distInfo = await stat(distDir)
if (!distInfo.isDirectory()) {
  console.error('dist 存在但不是目录。请删除该路径后重新运行 npm run build。')
  process.exit(1)
}

const files = await collectFiles(distDir)
if (files.length === 0) {
  console.error('dist/ 为空。请确认 npm run build 已生成前端产物。')
  process.exit(1)
}

const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0)
const jsFiles = files.filter((file) => file.ext === '.js').sort((a, b) => b.bytes - a.bytes)
const cssFiles = files.filter((file) => file.ext === '.css').sort((a, b) => b.bytes - a.bytes)
const largestJs = jsFiles[0]
const largestCss = cssFiles[0]

if (jsFiles.length === 0) {
  console.error('dist/ 中没有 JS 文件。请确认构建产物是否完整。')
  process.exit(1)
}

if (cssFiles.length === 0) {
  console.warn('警告：dist/ 中没有 CSS 文件。')
}

console.log('Bundle 报告')
console.log(`dist 总体积：${formatBytes(totalBytes)}`)
if (largestJs) console.log(`最大 JS：${largestJs.path} (${formatBytes(largestJs.bytes)})`)
if (largestCss) console.log(`最大 CSS：${largestCss.path} (${formatBytes(largestCss.bytes)})`)
console.log('最大文件：')
for (const file of [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 12)) {
  console.log(`- ${file.path}: ${formatBytes(file.bytes)}`)
}
console.log('预算阈值：')
console.log(`- 最大 JS：${formatBytes(budgets.largestJsBytes)}`)
console.log(`- 最大 CSS：${formatBytes(budgets.largestCssBytes)}`)
console.log(`- dist 总体积：${formatBytes(budgets.totalBytes)}`)

const failures = []
if (largestJs && largestJs.bytes > budgets.largestJsBytes) {
  failures.push(`最大 JS ${formatBytes(largestJs.bytes)} 超过 ${formatBytes(budgets.largestJsBytes)}`)
}
if (largestCss && largestCss.bytes > budgets.largestCssBytes) {
  failures.push(`最大 CSS ${formatBytes(largestCss.bytes)} 超过 ${formatBytes(budgets.largestCssBytes)}`)
}
if (totalBytes > budgets.totalBytes) {
  failures.push(`dist 总体积 ${formatBytes(totalBytes)} 超过 ${formatBytes(budgets.totalBytes)}`)
}

if (failures.length > 0) {
  console.error('Bundle budget 失败：')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Bundle budget 通过')
