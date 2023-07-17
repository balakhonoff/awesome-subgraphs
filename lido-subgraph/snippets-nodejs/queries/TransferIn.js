import { gql } from 'graphql-request'

export const transferInQuery = gql`
  query LidoTransfersInbound($address: String!) {
    lidoTransfers(first: 1000, where: { to: $address }) {
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
