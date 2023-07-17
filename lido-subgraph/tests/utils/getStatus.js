import { gql } from 'graphql-request'
import { subgraphFetch } from './index.js'

const statusQuery = gql`
  query {
    _meta {
      block {
        number
        hash
      }
      deployment
      hasIndexingErrors
    }
  }
`

export const getStatus = async () => (await subgraphFetch(statusQuery))._meta

export const getLastIndexedBlock = async () => (await getStatus()).block.number

export const getIfIndexingErrored = async () =>
  (await getStatus()).hasIndexingErrors
