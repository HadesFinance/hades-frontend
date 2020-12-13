export const ROLE_TYPE = {
  ADMIN: 'admin',
  DEFAULT: 'admin',
  DEVELOPER: 'developer',
}

export const CANCEL_REQUEST_MESSAGE = 'cancel request'

export const globals = {
  hades: null,
  hTokenMap: new Map(),
  lpTokenMap: new Map(),
  loginAccount: null,
  pendingTransactions: [],
}

export const MAX_UINT256 = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'

export const literalToReal = (literal, decimals) => {
  const real = Number(literal) * 10 ** Number(decimals)
  return real.toString()
}

export const launchTransaction = async (transaction) => {
  try {
    const result = await transaction
    if (result.transactionHash) {
      globals.pendingTransactions.push(result.transactionHash)
    }
  } catch (e) {
    console.log('failed to launch transaction:', e);
    alert('failed to launch transaction:'+e)
  }
}

export const  realToLiteral = (real, decimals) => {
  const literal = Number(real) / 10 ** Number(decimals)
  return literal
}
