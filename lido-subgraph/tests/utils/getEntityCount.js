import { gql } from 'graphql-request'
import { subgraphFetch } from './index.js'

const genQuery = (entityName) => gql`
  query ($first: Int, $skip: Int, $block: Block_height) {
    ${entityName}(first: $first, skip: $skip, block: $block, orderBy: block, orderDirection: desc) {
      id
    }
  }
`

export const getEntityCount = async (entityName) =>
  (await subgraphFetch(genQuery(entityName)))[entityName].length
