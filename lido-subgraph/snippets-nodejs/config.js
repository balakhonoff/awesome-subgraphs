import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

export const ADDRESS = process.env.ADDRESS

export const RPC = process.env.RPC
export const GRAPH = process.env.GRAPH
export const GRAPH_MONITORING = process.env.GRAPH_MONITORING
export const LIDO_ADDRESS = process.env.LIDO_ADDRESS
