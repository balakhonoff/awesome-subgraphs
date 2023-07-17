import { BigInt, Address } from '@graphprotocol/graph-ts'
import {
  StartVote,
  CastVote,
  CastObjection,
  ExecuteVote,
  ChangeSupportRequired,
  ChangeMinQuorum,
  ChangeVoteTime,
  ChangeObjectionPhaseTime,
} from '../generated/Voting/Voting'
import {
  Voting,
  Vote,
  VotingObjection,
  ChangedSupportRequired,
  ChangedMinQuorum,
  ChangedVoteTime,
  ChangedObjectionPhaseTime,
  Shares,
} from '../generated/schema'
import { Totals } from '../generated/schema'

export function handleStartVote(event: StartVote): void {
  let entity = new Voting(event.params.voteId.toString())

  entity.index = event.params.voteId.toI32()
  entity.creator = event.params.creator
  entity.metadata = event.params.metadata
  entity.executed = false

  entity.save()
}

export function handleCastVote(event: CastVote): void {
  let entity = new Vote(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.voting = event.params.voteId.toString()
  entity.voter = event.params.voter
  entity.supports = event.params.supports
  entity.stake = event.params.stake

  entity.save()
}

export function handleCastObjection(event: CastObjection): void {
  let entity = new VotingObjection(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.voting = event.params.voteId.toString()
  entity.voter = event.params.voter
  entity.stake = event.params.stake

  entity.save()
}

export function handleExecuteVote(event: ExecuteVote): void {
  let entity = Voting.load(event.params.voteId.toString())

  if (entity == null) {
    entity = new Voting(event.params.voteId.toString())
  }

  entity.executed = true

  /**
  Accounting for calling burnShares() on Mainnet as we didn't yet have a proper event.
  This one-off operation allows us not to enable tracing.
   **/
  if (
    event.transaction.hash.toHexString() ==
    '0x55eb29bda8d96a9a92295c358edbcef087d09f24bd684e6b4e88b166c99ea6a7'
  ) {
    let accToBurn = Address.fromString(
      '0x3e40d73eb977dc6a537af587d48316fee66e9c8c'
    )
    let sharesToSubtract = BigInt.fromString('32145684728326685744')

    let shares = Shares.load(accToBurn)!
    shares.shares = shares.shares.minus(sharesToSubtract)
    shares.save()

    let totals = Totals.load('')!
    totals.totalShares = totals.totalShares.minus(sharesToSubtract)
    totals.save()
  }

  entity.save()
}

// Global settings

export function handleChangeSupportRequired(
  event: ChangeSupportRequired
): void {
  let entity = new ChangedSupportRequired(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.supportRequiredPct = event.params.supportRequiredPct

  entity.save()
}

export function handleChangeMinQuorum(event: ChangeMinQuorum): void {
  let entity = new ChangedMinQuorum(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.minAcceptQuorumPct = event.params.minAcceptQuorumPct

  entity.save()
}

export function handleChangeVoteTime(event: ChangeVoteTime): void {
  let entity = new ChangedVoteTime(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.voteTime = event.params.voteTime

  entity.save()
}

export function handleChangeObjectionPhaseTime(
  event: ChangeObjectionPhaseTime
): void {
  let entity = new ChangedObjectionPhaseTime(
    event.transaction.hash.toHex() + '-' + event.logIndex.toString()
  )

  entity.objectionPhaseTime = event.params.objectionPhaseTime

  entity.save()
}
