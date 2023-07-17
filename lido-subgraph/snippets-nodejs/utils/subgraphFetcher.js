import { request, gql } from 'graphql-request'
import { GRAPH, GRAPH_MONITORING } from '../config.js'

export const subgraphFetch = async (query, vars = {}, monitoring = false) =>
  await request(monitoring ? GRAPH_MONITORING : GRAPH, query, vars)

export { gql }
