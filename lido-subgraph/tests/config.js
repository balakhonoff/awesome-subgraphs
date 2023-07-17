export const RPC = process.env.RPC
export const GRAPH = process.env.GRAPH
export const LIDO_ADDRESS = process.env.LIDO_ADDRESS
export const NOP_ADDRESS = process.env.NOP_ADDRESS
export const ARAGON_ADDRESS = process.env.ARAGON_ADDRESS
export const EASYTRACK_ADDRESS = process.env.EASYTRACK_ADDRESS
export const DSM_ADDRESS = process.env.DSM_ADDRESS

export const getBlock = () => parseInt(process.env.BLOCK)
export const getNetwork = () => process.env.NETWORK
export const getIsMainnet = () => getNetwork() === 'mainnet'
export const getIsLimited = () => process.env.LIMITED === 'true'
