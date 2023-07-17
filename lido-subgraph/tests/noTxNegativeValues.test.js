import { gql } from 'graphql-request'
import { subgraphFetch } from './utils/index.js'

const sharesQuery = gql`
  query ($first: Int, $skip: Int, $block: Block_height) {
    lidoTransfers(
      first: $first
      skip: $skip
      block: $block
      where: { sharesAfterDecrease_lt: 0 }
    ) {
      id
    }
  }
`

const balanceQuery = gql`
  query ($first: Int, $skip: Int, $block: Block_height) {
    lidoTransfers(
      first: $first
      skip: $skip
      block: $block
      where: { balanceAfterDecrease_lt: 0 }
    ) {
      id
    }
  }
`

test('there are no transactions going to minus', async () => {
  const sharesItems = (await subgraphFetch(sharesQuery)).lidoTransfers
  const balanceItems = (await subgraphFetch(balanceQuery)).lidoTransfers

  expect(sharesItems.length).toEqual(0)
  expect(balanceItems.length).toEqual(0)
}, 50000)
