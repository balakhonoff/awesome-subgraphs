import { gql } from 'graphql-request'

export const submissionsQuery = gql`
  query LidoSubmissions($address: String!) {
    lidoSubmissions(first: 1000, where: { sender: $address }) {
      sender
      amount

      shares
      sharesBefore
      sharesAfter

      totalPooledEtherBefore
      totalPooledEtherAfter
      totalSharesBefore
      totalSharesAfter

      balanceAfter

      block
      blockTime
      transactionHash
      transactionIndex
      logIndex
      transactionLogIndex
    }
  }
`
