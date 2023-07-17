import { gql } from 'graphql-request'

export const transferOutQuery = gql`
  query LidoTransfersInbound($address: String!) {
    lidoTransfers(first: 1000, where: { from: $address }) {
      from
      to
      value

      shares
      sharesBeforeDecrease
      sharesAfterDecrease
      sharesBeforeIncrease
      sharesAfterIncrease

      totalPooledEther
      totalShares

      balanceAfterDecrease
      balanceAfterIncrease

      mintWithoutSubmission

      block
      blockTime
      transactionHash
      transactionIndex
      logIndex
      transactionLogIndex
    }
  }
`
