import { getIfIndexingErrored } from './utils/index.js'

test('isNotErrored', async () => {
  const hasErrors = await getIfIndexingErrored()
  expect(hasErrors).toBe(false)
})
