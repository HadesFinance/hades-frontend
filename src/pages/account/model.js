import modelExtend from 'dva-model-extend'
import { model } from 'utils/model'
import { globals, launchTransaction, literalToReal } from '../../utils/constant';
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
      const network = store.get('network') ? store.get('network') : HADES_CONFIG.networks.test;
      let hades = (globals.hades = new Hades(network))
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
      }
      yield put({
        type: 'saveLoading',
        payload: { pageLoading: false}
      })
    },
    *queryPrice({ _ }, { call, put }){
      const network = store.get('network') ? store.get('network') : HADES_CONFIG.networks.test;
      let hades = (globals.hades = new Hades(network))
      const prices = yield hades.getPrices();
      yield put({
        type: 'savePrices',
        payload: { priceList: prices }
      });
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
