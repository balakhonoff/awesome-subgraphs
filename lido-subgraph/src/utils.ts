import { store, crypto } from '@graphprotocol/graph-ts'
import { BigInt, Address, ByteArray } from '@graphprotocol/graph-ts'

import {
  ORACLE_RUNS_BUFFER,
  getOraclePeriod,
  getFirstOracleReport,
  ZERO,
  ONE,
} from './constants'

export function guessOracleRunsTotal(currentblockTime: BigInt): BigInt {
  // We know when first Oracle report happened
  // We can find out for how long Oracle report have been happening
  // Knowing how often they happen, we can estimate how many reports there have been

  let currentFullDaysSinceEpoch = currentblockTime
  let oracleFirstDaySinceEpoch = getFirstOracleReport()

  let runningTime = currentFullDaysSinceEpoch.minus(oracleFirstDaySinceEpoch)

  // TODO: Can we improve this?
  // Writing this would round the number to zero:
  // let probableId = runningTime.div(getOraclePeriod())
  // For it's best to overestimate than underestimate:
  let probableId = BigInt.fromI64(
    <i64>Math.ceil(<f64>runningTime.toI64() / <f64>getOraclePeriod().toI64())
  )

  // If estimation is requested before first report, number would be negative
  if (probableId.le(ZERO)) {
    return ZERO
  }

  // Our estimation is not 100% accurate - it needs a safety buffer
  // We will try to load this estimate and if it fails try n-1 each time until we load an entity successfully or reach zero
  return probableId.plus(ORACLE_RUNS_BUFFER)
}

export function lastIncrementalId(entityName: string, i: BigInt): string {
  // Wrong id, doesn't exist yet. Make sure it doesn't load.
  if (i.equals(ZERO)) {
    // 0 id doesn't exist (id start from 1), but
    // But allows us to still do newId = lastIncrementalId() + 1
    return ZERO.toString()
  }

  // Try to load entity with this id
  let entity = store.get(entityName, i.toString())

  if (entity) {
    // It exists, return id
    return i.toString()
  } else {
    // It doesn't exist, trying id - 1
    return lastIncrementalId(entityName, i.minus(ONE))
  }
}

export function nextIncrementalId(entityName: string, i: BigInt): string {
  if (i.equals(ZERO)) {
    // No entities, start from 1
    return ONE.toString()
  }

  // Try to load entity with this id
  let entity = store.get(entityName, i.toString())

  if (entity) {
    let nextItem = i.plus(ONE)
    return nextItem.toString()
  } else {
    return nextIncrementalId(entityName, i.minus(ONE))
  }
}

/**
Temporary solution until conversion is implemented in Address:
https://github.com/graphprotocol/support/issues/40
**/

export function toChecksumAddress(address: Address): string {
  let lowerCaseAddress = address.toHex().slice(2)
  // note that this is actually a hash of the string representation of the hex without the "0x"
  let hash = crypto
    .keccak256(ByteArray.fromUTF8(address.toHex().slice(2)))
    .toHex()
    .slice(2)
  let result = '0x'

  for (let i = 0; i < lowerCaseAddress.length; i++) {
    if (parseInt(hash.charAt(i), 16) >= 8) {
      result += toUpper(lowerCaseAddress.charAt(i))
    } else {
      result += lowerCaseAddress.charAt(i)
    }
  }

  return result
}

// because there is no String.toUpper() in assemblyscript
function toUpper(str: string): string {
  let result = ''
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i)
    // only operate on lowercase 'a' through lower case 'z'
    if (charCode >= 97 && charCode <= 122) {
      result += String.fromCharCode(charCode - 32)
    } else {
      result += str.charAt(i)
    }
  }
  return result
}
