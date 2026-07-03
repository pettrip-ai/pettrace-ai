import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/pettrace-ai/ai')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

async function expectStoredSetting(page: Page, key: 'apiKey' | 'model', value: string) {
  await expect.poll(async () => page.evaluate((settingKey) => {
    const raw = window.localStorage.getItem('pettrace:settings')
    if (!raw) return undefined
    return (JSON.parse(raw) as Record<string, unknown>)[settingKey]
  }, key)).toBe(value)
}

test('AI 规划可以跳转到地图地点', async ({ page }) => {
  await expect(page.getByText(/今天想带/)).toBeVisible()

  await page.getByPlaceholder('告诉AI你想去哪里...').click()
  await expect(page.getByRole('heading', { name: 'PetTrace AI' })).toBeVisible()

  await page.getByPlaceholder('告诉我你的目的地').fill('带金毛去上海玩一天，晚餐要室内可进')
  await page.getByRole('button', { name: '发送' }).click()

  const routeButton = page.getByRole('button', { name: /查看路线/ }).first()
  await expect(routeButton).toBeVisible()
  await routeButton.click()

  await expect(page).toHaveURL(/\/pettrace-ai\/map\?place=[^&]+/)
  const placeId = new URL(page.url()).searchParams.get('place')
  expect(placeId).toMatch(/^(shanghai|beijing|guangzhou|chengdu)-\d+$/)
  await expect(page.locator('[data-map-search]')).toBeVisible()
  await expect(page.getByPlaceholder('搜索宠物友好地点...')).toBeVisible()
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
