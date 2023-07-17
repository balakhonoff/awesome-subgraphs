import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  Issue,
  Redeem,
  Deprecate,
  Params,
  DestroyedBlackFunds,
  AddedBlackList,
  RemovedBlackList,
  Approval,
  Transfer,
  Pause,
  Unpause
} from "../generated/Contract/Contract"

export function createIssueEvent(amount: BigInt): Issue {
  let issueEvent = changetype<Issue>(newMockEvent())

  issueEvent.parameters = new Array()

  issueEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return issueEvent
}

export function createRedeemEvent(amount: BigInt): Redeem {
  let redeemEvent = changetype<Redeem>(newMockEvent())

  redeemEvent.parameters = new Array()

  redeemEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return redeemEvent
}

export function createDeprecateEvent(newAddress: Address): Deprecate {
  let deprecateEvent = changetype<Deprecate>(newMockEvent())

  deprecateEvent.parameters = new Array()

  deprecateEvent.parameters.push(
    new ethereum.EventParam(
      "newAddress",
      ethereum.Value.fromAddress(newAddress)
    )
  )

  return deprecateEvent
}

export function createParamsEvent(
  feeBasisPoints: BigInt,
  maxFee: BigInt
): Params {
  let paramsEvent = changetype<Params>(newMockEvent())

  paramsEvent.parameters = new Array()

  paramsEvent.parameters.push(
    new ethereum.EventParam(
      "feeBasisPoints",
      ethereum.Value.fromUnsignedBigInt(feeBasisPoints)
    )
  )
  paramsEvent.parameters.push(
    new ethereum.EventParam("maxFee", ethereum.Value.fromUnsignedBigInt(maxFee))
  )

  return paramsEvent
}

export function createDestroyedBlackFundsEvent(
  _blackListedUser: Address,
  _balance: BigInt
): DestroyedBlackFunds {
  let destroyedBlackFundsEvent = changetype<DestroyedBlackFunds>(newMockEvent())

  destroyedBlackFundsEvent.parameters = new Array()

  destroyedBlackFundsEvent.parameters.push(
    new ethereum.EventParam(
      "_blackListedUser",
      ethereum.Value.fromAddress(_blackListedUser)
    )
  )
  destroyedBlackFundsEvent.parameters.push(
    new ethereum.EventParam(
      "_balance",
      ethereum.Value.fromUnsignedBigInt(_balance)
    )
  )

  return destroyedBlackFundsEvent
}

export function createAddedBlackListEvent(_user: Address): AddedBlackList {
  let addedBlackListEvent = changetype<AddedBlackList>(newMockEvent())

  addedBlackListEvent.parameters = new Array()

  addedBlackListEvent.parameters.push(
    new ethereum.EventParam("_user", ethereum.Value.fromAddress(_user))
  )

  return addedBlackListEvent
}

export function createRemovedBlackListEvent(_user: Address): RemovedBlackList {
  let removedBlackListEvent = changetype<RemovedBlackList>(newMockEvent())

  removedBlackListEvent.parameters = new Array()

  removedBlackListEvent.parameters.push(
    new ethereum.EventParam("_user", ethereum.Value.fromAddress(_user))
  )

  return removedBlackListEvent
}

export function createApprovalEvent(
  owner: Address,
  spender: Address,
  value: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent())

  approvalEvent.parameters = new Array()

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("spender", ethereum.Value.fromAddress(spender))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return approvalEvent
}

export function createTransferEvent(
  from: Address,
  to: Address,
  value: BigInt
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return transferEvent
}

export function createPauseEvent(): Pause {
  let pauseEvent = changetype<Pause>(newMockEvent())

  pauseEvent.parameters = new Array()

  return pauseEvent
}

export function createUnpauseEvent(): Unpause {
  let unpauseEvent = changetype<Unpause>(newMockEvent())

  unpauseEvent.parameters = new Array()

  return unpauseEvent
}
