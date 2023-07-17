import Big from 'big.js'

// Separate instance for displaying ETH
const BigDecimal = Big()

Big.DP = 0
BigDecimal.DP = 18

Big.RM = Big.roundDown
BigDecimal.RM = Big.roundHalfUp

Big.NE = -70000000
BigDecimal.NE = -70000000
Big.PE = 210000000
BigDecimal.PE = 210000000

export { Big, BigDecimal }
