import { BigInt, Address, TypedMap } from '@graphprotocol/graph-ts'
import { dataSource } from '@graphprotocol/graph-ts'

import { Settings } from '../generated/schema'

const network = dataSource.network()
const isMainnet = network == 'mainnet'

/**
Units
**/

export const ZERO = BigInt.fromI32(0)
export const ONE = BigInt.fromI32(1)

export const CALCULATION_UNIT = BigInt.fromI32(10000)

// 1 ETH in WEI
export const ETHER = BigInt.fromString('1000000000000000000')

/**
Deposits
**/

export const DEPOSIT_SIZE = BigInt.fromI32(32)
export const DEPOSIT_AMOUNT = DEPOSIT_SIZE.times(ETHER) // in Wei

/**
Oracle
**/

// Buffer of oracle runs if we underestimated the number
export const ORACLE_RUNS_BUFFER = BigInt.fromI32(50)

export const MAINNET_FIRST_ORACLE_REPORT = BigInt.fromI32(1610016625) // block 11607098
export const TESTNET_FIRST_ORACLE_REPORT = BigInt.fromI32(1617282681) // block 4543056

// Oracle report period is dependent on network (eg much often on testnet)
export const MAINNET_ORACLE_PERIOD = BigInt.fromI32(86400) // 1 day
export const TESTNET_ORACLE_PERIOD = BigInt.fromI32(3840) // 10 epochs by ~6.4 minutes

export const getFirstOracleReport = (): BigInt =>
  isMainnet ? MAINNET_FIRST_ORACLE_REPORT : TESTNET_FIRST_ORACLE_REPORT

export const getOraclePeriod = (): BigInt =>
  isMainnet ? MAINNET_ORACLE_PERIOD : TESTNET_ORACLE_PERIOD

/**
Addresses
**/

export const ZERO_ADDRESS = Address.fromString(
  '0x0000000000000000000000000000000000000000'
)

const LIDO_ADDRESSES = new TypedMap<string, string>()
LIDO_ADDRESSES.set('mainnet', '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84')
LIDO_ADDRESSES.set('goerli', '0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F')

const NOS_ADDRESSES = new TypedMap<string, string>()
NOS_ADDRESSES.set('mainnet', '0x55032650b14df07b85bF18A3a3eC8E0Af2e028d5')
NOS_ADDRESSES.set('goerli', '0x9D4AF1Ee19Dad8857db3a45B0374c81c8A1C6320')

const TREASURY_ADDRESSES = new TypedMap<string, string>()
TREASURY_ADDRESSES.set('mainnet', '0x3e40D73EB977Dc6a537aF587D48316feE66E9C8c')
TREASURY_ADDRESSES.set('goerli', '0x4333218072D5d7008546737786663c38B4D561A4')

// We presume here that initially insurance fund was the treasury
const getInsuranceFund = (): string =>
  Settings.load('')
    ? Settings.load('')!.insuranceFund.toHex()
    : TREASURY_ADDRESSES.get(network)!

export const getAddress = (contract: string): Address =>
  Address.fromString(
    (contract == 'Lido'
      ? LIDO_ADDRESSES.get(network)
      : contract == 'NodeOperatorsRegistry'
      ? NOS_ADDRESSES.get(network)
      : contract == 'Insurance Fund'
      ? getInsuranceFund()
      : contract == 'Treasury'
      ? TREASURY_ADDRESSES.get(network)
      : null)!
  )
