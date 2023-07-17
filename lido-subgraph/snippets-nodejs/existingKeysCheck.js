import { subgraphFetch, gql } from './utils.js'

const pubKey = '0x123'

const query = gql`
  {
    nodeOperatorSigningKeys(where: { pubkey: "${pubKey}" }) {
      id
      operatorId
      pubkey
    }
  }
`

const keys = (await subgraphFetch(query)).nodeOperatorSigningKeys

keys.length > 0
  ? console.log('Key already exists')
  : console.log("Key doesn't exist yet")
