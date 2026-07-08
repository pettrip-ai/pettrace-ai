import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/pettrace-ai/ai')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('AI itinerary detail remains readable on narrow mobile width', async ({ page }) => {
  await page.goto('/pettrace-ai/ai/chat?q=%E4%B8%8A%E6%B5%B7%E5%B8%A6%E7%8B%97%E4%B8%80%E6%97%A5%E6%B8%B8%EF%BC%8C%E5%AE%89%E6%8E%92%E5%AE%A4%E5%86%85%E7%94%A8%E9%A4%90%E5%92%8C%E6%88%B7%E5%A4%96%E6%95%A3%E6%AD%A5')

  const planRow = page.locator('[data-ai-structured-plan-row="true"]').first()
  const itineraryCard = page.locator('[data-ai-itinerary-card]').first()
  const timeChip = page.locator('[data-ai-itinerary-time-chip]').first()
  const stepBody = page.locator('[data-ai-itinerary-step-body]').first()
  const stepTitle = page.locator('[data-ai-itinerary-step-title]').first()
  const ruleChip = page.locator('[data-ai-itinerary-rule-chip]').first()

  await expect(planRow).toBeVisible()
  await expect(itineraryCard).toBeVisible()
  await expect(timeChip).toBeVisible()
  await expect(stepBody).toBeVisible()

  const viewportWidth = page.viewportSize()?.width ?? 393
  const rowBox = await planRow.boundingBox()
  const cardBox = await itineraryCard.boundingBox()
  const bodyBox = await stepBody.boundingBox()
  const titleBox = await stepTitle.boundingBox()
  const ruleBox = await ruleChip.boundingBox()
  const timeStyles = await timeChip.evaluate((el) => {
    const styles = window.getComputedStyle(el)
    return {
      backgroundColor: styles.backgroundColor,
      color: styles.color,
    }
  })

  expect(rowBox).not.toBeNull()
  expect(cardBox).not.toBeNull()
  expect(bodyBox).not.toBeNull()
  expect(titleBox).not.toBeNull()
  expect(ruleBox).not.toBeNull()
  if (!rowBox || !cardBox || !bodyBox || !titleBox || !ruleBox) return

  expect(rowBox.width).toBeGreaterThan(viewportWidth * 0.86)
  expect(cardBox.width).toBeGreaterThan(viewportWidth * 0.72)
  expect(bodyBox.width).toBeGreaterThan(220)
  expect(ruleBox.width).toBeLessThanOrEqual(bodyBox.width + 1)
  expect(titleBox.height).toBeLessThan(48)
  expect(timeStyles.backgroundColor).not.toBe('rgb(247, 107, 122)')
  expect(timeStyles.color).not.toBe('rgb(84, 49, 31)')
})

async function expectStoredSetting(page: Page, key: 'apiKey' | 'model', value: string) {
  await expect.poll(async () => page.evaluate((settingKey) => {
    const raw = window.localStorage.getItem('pettrace:settings')
    if (!raw) return undefined
    return (JSON.parse(raw) as Record<string, unknown>)[settingKey]
  }, key)).toBe(value)
}

test('AI 任务台示例可以生成计划并跳转到地图地点', async ({ page }) => {
  await expect(page.getByText(/AI 行程任务台/)).toBeVisible()
  await expect(page.getByText(/让 AI 把宠物档案/)).toBeVisible()
  await expect(page.getByText('地点规则', { exact: true })).toBeVisible()
  await expect(page.getByText('社区验证', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: /大型犬友好一日游/ }).click()
  await expect(page.getByRole('heading', { name: 'PetTrace AI' })).toBeVisible()

  const routeButton = page.getByRole('button', { name: /查看地图/ }).first()
  await expect(routeButton).toBeVisible()
  await routeButton.click()

  await expect(page).toHaveURL(/\/pettrace-ai\/map\?place=[^&]+/)
  const placeId = new URL(page.url()).searchParams.get('place')
  expect(placeId).toMatch(/^(shanghai|beijing|guangzhou|chengdu)-\d+$/)
  await expect(page.locator('[data-map-search]')).toBeVisible()
  await expect(page.getByPlaceholder('搜索宠物友好地点...')).toBeVisible()
})

test('AI 计划可以写入本地社区验证', async ({ page }) => {
  await expect(page.getByText(/AI 行程任务台/)).toBeVisible()

  await page.getByRole('button', { name: /大型犬友好一日游/ }).click()
  await expect(page.getByText('风险提示')).toBeVisible()

  await page.getByRole('button', { name: /标记已验证/ }).first().click()
  await expect(page.getByText('已写入社区验证')).toBeVisible()
  await expect.poll(async () => page.evaluate(() => {
    const raw = window.localStorage.getItem('pettrace:feeds')
    if (!raw) return false
    return raw.includes('现场规则一致') || raw.includes('真实验证')
  })).toBe(true)

  await page.goto('/pettrace-ai/community')
  await expect(page.getByText(/真实验证|现场规则一致/)).toBeVisible()
})

test('可以基于本地数据发布社区验证', async ({ page }) => {
  await page.getByRole('tab', { name: '社区' }).click()
  await expect(page.getByRole('heading', { name: '社区' })).toBeVisible()

  await page.getByRole('button', { name: /发布验证/ }).click()
  const postDialog = page.getByRole('dialog')
  await postDialog.getByRole('button', { name: /打卡/ }).click()
  await page
    .getByPlaceholder('今天我也去了这家，带金毛室内坐不挤...')
    .fill('E2E 验证：现场规则清晰，牵绳即可进入户外区。')
  await page.getByRole('button', { name: '发布', exact: true }).click()

  await expect(page.getByText('发布成功')).toBeVisible()
  await expect(page.locator('p').filter({ hasText: /E2E 验证/ })).toBeVisible()
})

test('设置可以通过 LocalStorage 重新水合', async ({ page }) => {
  await page.getByRole('tab', { name: '设置' }).click()
  await expect(page.getByText('AI 服务')).toBeVisible()

  await page.locator('#api-key').fill('sk-e2e-local')
  await expectStoredSetting(page, 'apiKey', 'sk-e2e-local')

  await page.locator('#ai-model').fill('e2e-model')
  await expectStoredSetting(page, 'model', 'e2e-model')

  await page.reload()

  await expect(page.locator('#api-key')).toHaveValue('sk-e2e-local')
  await expect(page.locator('#ai-model')).toHaveValue('e2e-model')
})
