export const ROLE_TYPE = {
  ADMIN: 'admin',
  DEFAULT: 'admin',
  DEVELOPER: 'developer',
}

export const CANCEL_REQUEST_MESSAGE = 'cancel request'

export const globals = {
  realDAO: null,
  rTokenMap: new Map(),
  lpTokenMap: new Map(),
  loginAccount: null,
  pendingTransactions: [],
  wallet:null
}

export const MAX_UINT256 = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'

export const literalToReal = (literal, decimals) => {
  const real = Number(literal) * 10 ** Number(decimals)
  return real.toString()
}

export const launchTransaction = async (transaction) => {
  console.log(transaction)
  try {
    const result = await transaction
    console.log(result);
    if (result.transactionHash) {
      globals.pendingTransactions.push(result.transactionHash);
      return {success: true}
    }
  } catch (e) {
    console.log('failed to launch transaction:', e);
    alert('failed to launch transaction:'+e)
    return {success: false}
  }
}

export const  realToLiteral = (real, decimals) => {
  const literal = Number(real) / 10 ** Number(decimals)
  return literal
}

