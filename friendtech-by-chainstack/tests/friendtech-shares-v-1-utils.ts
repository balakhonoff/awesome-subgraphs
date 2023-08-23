import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  OwnershipTransferred,
  Trade
} from "../generated/FriendtechSharesV1/FriendtechSharesV1"

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createTradeEvent(
  trader: Address,
  subject: Address,
  isBuy: boolean,
  shareAmount: BigInt,
  ethAmount: BigInt,
  protocolEthAmount: BigInt,
  subjectEthAmount: BigInt,
  supply: BigInt
): Trade {
  let tradeEvent = changetype<Trade>(newMockEvent())

  tradeEvent.parameters = new Array()

  tradeEvent.parameters.push(
    new ethereum.EventParam("trader", ethereum.Value.fromAddress(trader))
  )
  tradeEvent.parameters.push(
    new ethereum.EventParam("subject", ethereum.Value.fromAddress(subject))
  )
  tradeEvent.parameters.push(
    new ethereum.EventParam("isBuy", ethereum.Value.fromBoolean(isBuy))
  )
  tradeEvent.parameters.push(
    new ethereum.EventParam(
      "shareAmount",
      ethereum.Value.fromUnsignedBigInt(shareAmount)
    )
  )
  tradeEvent.parameters.push(
    new ethereum.EventParam(
      "ethAmount",
      ethereum.Value.fromUnsignedBigInt(ethAmount)
    )
  )
  tradeEvent.parameters.push(
    new ethereum.EventParam(
      "protocolEthAmount",
      ethereum.Value.fromUnsignedBigInt(protocolEthAmount)
    )
  )
  tradeEvent.parameters.push(
    new ethereum.EventParam(
      "subjectEthAmount",
      ethereum.Value.fromUnsignedBigInt(subjectEthAmount)
    )
  )
  tradeEvent.parameters.push(
    new ethereum.EventParam("supply", ethereum.Value.fromUnsignedBigInt(supply))
  )

  return tradeEvent
}
