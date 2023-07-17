import { gql, request } from 'graphql-request'
import { GRAPH } from '../config.js'

const query = gql`
  query {
    lidoTransfers(skip: 5001) {
      id
    }
  }
`

export const checkIfLimited = async () => {
  try {
    await request(GRAPH, query)
    return false
  } catch {
    return true
  }
}
