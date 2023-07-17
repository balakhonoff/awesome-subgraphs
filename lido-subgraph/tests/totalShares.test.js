import { gql } from 'graphql-request'
import { lidoFuncCall, subgraphFetch } from './utils/index.js'

const query = gql`
  query ($block: Block_height) {
    totals(id: "", block: $block) {
      totalShares
    }
  }
`

test('totalShares', async () => {
  const realTotalShares = (await lidoFuncCall('getTotalShares')).toString()
  const subgraphTotalShares = (await subgraphFetch(query)).totals.totalShares

  expect(subgraphTotalShares).toEqual(realTotalShares)
})
