import { Lido } from '../generated/Lido/Lido'
import { NodeOperatorsRegistry } from '../generated/NodeOperatorsRegistry/NodeOperatorsRegistry'

import { getAddress } from './constants'

export const loadLidoContract = (): Lido => Lido.bind(getAddress('Lido'))

export const loadNosContract = (): NodeOperatorsRegistry =>
  NodeOperatorsRegistry.bind(getAddress('NodeOperatorsRegistry'))
