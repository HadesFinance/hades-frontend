import modelExtend from 'dva-model-extend'
import { model } from 'utils/model'
import { globals, launchTransaction, literalToReal, MAX_UINT256 } from '../../utils/constant';
import Hades from '../../utils/hades';
import store from 'store'
import { HADES_CONFIG } from '../../../config';

async function processMarkets() {
  const markets = await globals.hades.getMarkets()
  for (const market of markets) {
    globals.hTokenMap.set(market.underlyingSymbol, market.hToken)
  }
  return markets
}

async function processPools() {
  const result = await globals.hades.getPools()
  for (const pool of result.pools) {
    globals.lpTokenMap.set(pool.id, pool.tokenAddr)
  }
  return result
}


export default modelExtend(model, {
  namespace: 'account',
  state: {
    connected: false,
    loginAccount: null,
    wrongNetwork: false,
    account:{
      hds:{
        balance:0
      },
      sheets:[]
    },
    accountLiquidity:{
      liquidity: 0,
      liquidityLiteral: 0,
      shortfall: 0,
      shortfallLiteral: 0,
    },
    priceList:[],
    pageLoading: true
  },
  effects: {
    *login({ _ }, { call, put }) {
      let hades = globals.hades;
      if(hades){
        let wrongNetwork;
        if (hades.chainId() <= 42 && hades.chainId() !== Number(window.ethereum.chainId)) {
          wrongNetwork = true
        }else {
          wrongNetwork = false
        }
        const loginAccount = (globals.loginAccount = window.ethereum.selectedAddress);
        if(loginAccount){
          yield put({
            type: 'saveState',
            payload: { loginAccount: loginAccount, wrongNetwork: wrongNetwork, connected: loginAccount ? true : false}
          });
          const result = yield globals.hades.getAccountBalances(loginAccount);
          yield put({
            type: 'saveAccount',
            payload: { account: result }
          });
          const liquidity = yield globals.hades.getAccountLiquidity(loginAccount);
          yield put({
            type: 'saveAccountLiquidity',
            payload: { accountLiquidity: liquidity }
          });
          processMarkets();
          processPools();
          hades.loadHTokens()
        }else {
          yield hades.setProvider(window.web3.currentProvider);
          const loginAccount = (globals.loginAccount = window.ethereum.selectedAddress)
          yield put({
            type: 'saveState',
            payload: { loginAccount: loginAccount, wrongNetwork: wrongNetwork, connected: loginAccount ? true : false}
          });
          if(loginAccount){
            const result = yield globals.hades.getAccountBalances(loginAccount);
            yield put({
              type: 'saveAccount',
              payload: { account: result }
            });
            const liquidity = yield globals.hades.getAccountLiquidity(loginAccount);
            yield put({
              type: 'saveAccountLiquidity',
              payload: { accountLiquidity: liquidity }
            });
          }
          processMarkets()
          processPools()
          hades.loadHTokens()
        }
        yield put({
          type: 'saveLoading',
          payload: { pageLoading: false}
        })
      }
    },
    *queryPrice({ _ }, { call, put }){
      let hades = globals.hades;
      if(hades){
        const prices = yield hades.getPrices();
        yield put({
          type: 'savePrices',
          payload: { priceList: prices }
        });
      }
    },
    *queryRedeemResults({ payload }, { call, put }) {
      let {  address, symbol } = payload;
      const results = yield Promise.all([
        globals.hades.getHTokenBalances(address, globals.loginAccount),
        globals.hades.hToken(symbol, address),
      ]);
      return results
    },
    *submitRedeem({ payload }, { call, put }) {
      let { inputAmount, results } = payload;
      const realAmount = yield literalToReal(inputAmount, 8);
      const hToken = results[1];
      yield launchTransaction(hToken.redeem(realAmount).send({ from: globals.loginAccount }))
    },
    *queryRepayResults({ payload }, { call, put }) {
      let {  address, symbol } = payload;
      const results = yield Promise.all([
        globals.hades.getHTokenBalances(address, globals.loginAccount),
        globals.hades.hToken(symbol, address),
        globals.hades.dol(),
      ]);
      return results
    },
    *submitRepay({ payload }, { call, put }) {
      let { inputAmount, results, symbol, address, showApprove } = payload;
      const balanceInfo = results[0]
      const hToken = results[1]
      const dol = results[2]
      const realAmount = yield literalToReal(inputAmount, balanceInfo.underlyingDecimals)
      if (symbol === 'ETH') {
        yield launchTransaction(hToken.repayBorrow().send({ from: globals.loginAccount, value: realAmount }))
        yield put({
          type: 'login'
        });
      } else {
        if(showApprove){
          yield dol.approve(address, MAX_UINT256).send({ from: globals.loginAccount });
        }
      }
    },
    *repayDol({ payload }, { call, put }) {
      let { inputAmount, results } = payload;
      const balanceInfo = results[0]
      const hToken = results[1]
      const realAmount = yield literalToReal(inputAmount, balanceInfo.underlyingDecimals)
      yield launchTransaction(hToken.repayBorrow(realAmount).send({ from: globals.loginAccount }))
      yield put({
        type: 'login'
      });
    },
  },
  reducers: {
    saveState(state, { payload: { loginAccount, wrongNetwork, connected } }) {
      return {
        ...state,
        loginAccount,
        wrongNetwork,
        connected
      }
    },
    saveAccount(state, { payload: { account } }) {
      return {
        ...state,
        account,
      }
    },
    saveAccountLiquidity(state, { payload: { accountLiquidity } }) {
      return {
        ...state,
        accountLiquidity,
      }
    },
    savePrices(state, { payload: { priceList } }) {
      return {
        ...state,
        priceList,
      }
    },
    saveLoading(state, { payload: { pageLoading } }) {
      return {
        ...state,
        pageLoading,
      }
    },
  },

})
