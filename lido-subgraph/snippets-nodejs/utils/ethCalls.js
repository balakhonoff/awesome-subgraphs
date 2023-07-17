import { ethers } from 'ethers'
import fs from 'fs'

import { RPC, LIDO_ADDRESS } from '../config.js'

const provider = new ethers.providers.JsonRpcProvider(RPC)

const lidoAbi = JSON.parse(fs.readFileSync('../abis/Lido.json'))
const lidoContract = new ethers.Contract(LIDO_ADDRESS, lidoAbi, provider)

export const ethCall = async (func, ...args) => await provider[func](...args)

export const lidoFuncCall = async (func, ...args) =>
  await lidoContract[func](...args)

export const getAddressShares = async (address, ...args) =>
  await lidoFuncCall('sharesOf', address, ...args)

export const getAddressBalance = async (address, ...args) =>
  await lidoFuncCall('balanceOf', address, ...args)

export const getBalanceFromShares = async (address, ...args) =>
  await lidoFuncCall('getPooledEthByShares', address, ...args)
