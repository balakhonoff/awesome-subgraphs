import { gql } from 'graphql-request'

export const totalRewardQuery = gql`
  {
    totalRewards(first: 1000) {
      totalPooledEtherBefore
      totalPooledEtherAfter
      totalSharesBefore
      totalSharesAfter

      block
      blockTime
      logIndex
    }
  }
`
