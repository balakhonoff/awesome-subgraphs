import { newMockEvent } from "matchstick-as"
import { ethereum, Bytes, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  Deposit,
  Withdrawal
} from "../generated/TornadoContract/TornadoContract"

export function createDepositEvent(
  commitment: Bytes,
  leafIndex: BigInt,
  timestamp: BigInt
): Deposit {
  let depositEvent = changetype<Deposit>(newMockEvent())

  depositEvent.parameters = new Array()

  depositEvent.parameters.push(
    new ethereum.EventParam(
      "commitment",
      ethereum.Value.fromFixedBytes(commitment)
    )
  )
  depositEvent.parameters.push(
    new ethereum.EventParam(
      "leafIndex",
      ethereum.Value.fromUnsignedBigInt(leafIndex)
    )
  )
  depositEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return depositEvent
}

export function createWithdrawalEvent(
  to: Address,
  nullifierHash: Bytes,
  relayer: Address,
  fee: BigInt
): Withdrawal {
  let withdrawalEvent = changetype<Withdrawal>(newMockEvent())

  withdrawalEvent.parameters = new Array()

  withdrawalEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  withdrawalEvent.parameters.push(
    new ethereum.EventParam(
      "nullifierHash",
      ethereum.Value.fromFixedBytes(nullifierHash)
    )
  )
  withdrawalEvent.parameters.push(
    new ethereum.EventParam("relayer", ethereum.Value.fromAddress(relayer))
  )
  withdrawalEvent.parameters.push(
    new ethereum.EventParam("fee", ethereum.Value.fromUnsignedBigInt(fee))
  )

  return withdrawalEvent
}
