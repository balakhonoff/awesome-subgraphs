import { gql } from 'graphql-request'
import { subgraphFetch } from './utils/index.js'

const dustNullQuery = gql`
  query ($first: Int, $skip: Int, $block: Block_height) {
    totalRewards(
      first: $first
      skip: $skip
      block: $block
      where: { dust: null }
    ) {
      id
      block
    }
  }
`

test('there are no rewards with null dust', async () => {
  const totalRewards = (await subgraphFetch(dustNullQuery)).totalRewards

  expect(totalRewards).toEqual([])
})

// Dust should be 0 when there are treasuryFees
const simultaneousQuery = gql`
  query ($first: Int, $skip: Int, $block: Block_height) {
    totalRewards(
      first: $first
      skip: $skip
      block: $block
      where: { dust_not: 0, treasuryFee_not: 0 }
    ) {
      id
      block
    }
  }
`

test('there are no txs with both dust and treasuryFee', async () => {
  const totalRewards = (await subgraphFetch(simultaneousQuery)).totalRewards

  expect(totalRewards).toEqual([])
})
