import { ethers } from 'ethers'
import fs from 'fs'

import {
  ARAGON_ADDRESS,
  DSM_ADDRESS,
  EASYTRACK_ADDRESS,
  LIDO_ADDRESS,
  NOP_ADDRESS,
  RPC,
  getBlock
} from '../config.js'

const provider = new ethers.providers.JsonRpcProvider(RPC)

const lidoAbi = JSON.parse(fs.readFileSync('abis/Lido.json'))
const lidoContract = new ethers.Contract(LIDO_ADDRESS, lidoAbi, provider)

const oracleAddress = await lidoContract.getOracle()
const oracleAbi = JSON.parse(fs.readFileSync('abis/LidoOracle.json'))
const oracleContract = new ethers.Contract(oracleAddress, oracleAbi, provider)

const nopRegistryAbi = JSON.parse(
  fs.readFileSync('abis/NodeOperatorsRegistry.json')
)
const nopRegistryContract = new ethers.Contract(
  NOP_ADDRESS,
  nopRegistryAbi,
  provider
)

const aragonAbi = JSON.parse(fs.readFileSync('abis/Voting.json'))
const aragonContract = new ethers.Contract(ARAGON_ADDRESS, aragonAbi, provider)

const easyTrackAbi = JSON.parse(fs.readFileSync('abis/Easytrack.json'))
const easyTrackContract = new ethers.Contract(
  EASYTRACK_ADDRESS,
  easyTrackAbi,
  provider
)

const dsmAbi = JSON.parse(fs.readFileSync('abis/DepositSecurityModule.json'))
const dsmContract = new ethers.Contract(DSM_ADDRESS, dsmAbi, provider)

const mbAddBlock = async args => {
  const blockIsOverriden = args.find(x => x.blockTag)

  if (blockIsOverriden) {
    return args
  }

  const block = getBlock()

  args.push({ blockTag: block })

  return args
}

export const ethCall = async (func, ...initialArgs) =>
  await provider[func](...(await mbAddBlock(initialArgs)))

export const lidoFuncCall = async (func, ...initialArgs) =>
  await lidoContract[func](...(await mbAddBlock(initialArgs)))

export const oracleFuncCall = async (func, ...initialArgs) =>
  await oracleContract[func](...(await mbAddBlock(initialArgs)))

export const getAddressShares = async (address, ...args) =>
  await lidoFuncCall('sharesOf', address, ...args)

export const getAddressBalance = async (address, ...args) =>
  await lidoFuncCall('balanceOf', address, ...args)

export const getBalanceFromShares = async (address, ...args) =>
  await lidoFuncCall('getPooledEthByShares', address, ...args)

export const getEvents = async (contract, eventName, startBlock, endBlock) => {
  const filter = contract.filters[eventName]()
  return await contract.queryFilter(
    filter,
    startBlock ?? 0,
    endBlock ?? getBlock()
  )
}

export const getLidoEvents = async (eventName, startBlock) => {
  return await getEvents(lidoContract, eventName, startBlock)
}

export const getLidoEventNumber = async eventName => {
  return await getLidoEvents(eventName).length
}

export const getLidoOracleEvents = async (eventName, startBlock) => {
  return await getEvents(oracleContract, eventName, startBlock)
}

export const getOracleEventNumber = async (eventName, startBlock) => {
  return (await getLidoOracleEvents(eventName, startBlock)).length
}

export const getNopRegistryEvents = async (eventName, startBlock) => {
  return await getEvents(nopRegistryContract, eventName, startBlock)
}

export const getAragonEvents = async (eventName, startBlock) => {
  return await getEvents(aragonContract, eventName, startBlock)
}

export const getEasyTrackEvents = async (eventName, startBlock) => {
  return await getEvents(easyTrackContract, eventName, startBlock)
}

export const getDSMEvents = async (eventName, startBlock) => {
  return await getEvents(dsmContract, eventName, startBlock)
}

export const getRpcNetwork = async () => await provider.getNetwork()
