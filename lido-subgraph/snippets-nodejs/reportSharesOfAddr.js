import { subgraphFetch, gql, lidoFuncCall } from './utils.js'
import { ADDRESS } from './config.js'

const query = gql`
  {
    oracleCompleteds(first: 1000, orderBy: block, orderDirection: asc) {
      block
      blockTime
    }
  }
`

const oracleReports = (await subgraphFetch(query)).oracleCompleteds

for (let report of oracleReports) {
  const balance = await lidoFuncCall('sharesOf', ADDRESS, {
    blockTag: parseInt(report.block),
  })
  const humanTime = new Date(report.blockTime * 1000).toLocaleDateString(
    'ru-RU'
  )
  console.log(humanTime, balance.toString())
}
