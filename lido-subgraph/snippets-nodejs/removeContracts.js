import { ethCall } from './utils.js'

import fs from 'fs'

const withoutContracts = new Set()
const withContracts = await fs.promises.readFile('withContracts.json')

for (const adr of JSON.parse(withContracts)) {
  if ((await ethCall('getCode', adr)) === '0x') {
    withoutContracts.add(adr)
  } else {
    process.stdout.write('x')
  }
}

console.log(withoutContracts.size, 'non-contract addresses of stETH holders')

await fs.promises.writeFile(
  'nonContracts.json',
  JSON.stringify(Array.from(withoutContracts))
)
