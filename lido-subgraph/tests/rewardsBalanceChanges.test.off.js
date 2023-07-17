import { gql } from 'graphql-request'
import {
  getBalanceFromShares,
  subgraphFetch,
  BigNumber,
} from './utils/index.js'

const ADDRESSES_TO_TEST = 3
const timePerAddress = 100 // seconds
const timeout = ADDRESSES_TO_TEST * timePerAddress * 1000 // in ms

/**
NOTE: This test takes very long time per address.
**/

// Example USD values from 03.09.2021
const sharesChecks = [
  '17253336101171480', // 70usd
  '453884371982397608502', // 2mil usd
  '22253111414175281724765', // 90mil usd
].map((x) => BigNumber.from(x))

const ratioQuery = gql`
  query ($first: Int, $skip: Int, $block: Block_height) {
    totalRewards(
      first: $first
      skip: $skip
      block: $block
      orderBy: block
      orderDirection: asc
    ) {
      totalPooledEtherBefore
      totalPooledEtherAfter
      totalSharesBefore
      totalSharesAfter

      block
    }
  }
`

test(
  'rewards balance changes',
  async () => {
    const reports = (await subgraphFetch(ratioQuery)).totalRewards

    for (const shares of sharesChecks) {
      console.log('Checking shares', shares.toString())

      for (let report of reports) {
        const balanceBeforeSubgraph = shares
          .mul(report.totalPooledEtherBefore)
          .div(report.totalSharesBefore)

        const balanceAfterSubgraph = shares
          .mul(report.totalPooledEtherAfter)
          .div(report.totalSharesAfter)

        const rewardsSubgraph = balanceAfterSubgraph
          .sub(balanceBeforeSubgraph)
          .toString()

        const balanceBeforeReal = await getBalanceFromShares(shares, {
          blockTag: parseInt(report.block) - 1,
        })
        const balanceAfterReal = await getBalanceFromShares(shares, {
          blockTag: parseInt(report.block),
        })

        const rewardsReal = BigNumber.from(balanceAfterReal)
          .sub(balanceBeforeReal)
          .toString()

        expect(rewardsSubgraph).toEqual(rewardsReal)
      }
    }
  },
  timeout
)
