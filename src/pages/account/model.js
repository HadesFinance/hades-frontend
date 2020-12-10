import modelExtend from 'dva-model-extend'
import { model } from 'utils/model'
import { globals} from '../../utils/constant';
import Hades from '../../utils/hades';
import store from 'store'
import { HADES_CONFIG } from '../../../config';


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
    priceList:[]
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
      console.log('Login Account:', loginAccount);
      if(loginAccount){
        yield put({
          type: 'saveState',
          payload: { loginAccount: loginAccount, wrongNetwork: wrongNetwork, connected: loginAccount ? true : false}
        });
        const result = yield globals.hades.getAccountBalances(loginAccount);
        console.log(result);
        yield put({
          type: 'saveAccount',
          payload: { account: result }
        });
        const liquidity = yield globals.hades.getAccountLiquidity(loginAccount);
        console.log(liquidity);
        yield put({
          type: 'saveAccountLiquidity',
          payload: { accountLiquidity: liquidity }
        });
      }else {
        yield hades.setProvider(window.web3.currentProvider);
        const loginAccount = (globals.loginAccount = window.ethereum.selectedAddress)
        yield put({
          type: 'saveState',
          payload: { loginAccount: loginAccount, wrongNetwork: wrongNetwork, connected: loginAccount ? true : false}
        });
        if(loginAccount){
          const result = yield globals.hades.getAccountBalances(loginAccount);
          console.log(result);
          yield put({
            type: 'saveAccount',
            payload: { account: result }
          });
          const liquidity = yield globals.hades.getAccountLiquidity(loginAccount);
          console.log(liquidity);
          yield put({
            type: 'saveAccountLiquidity',
            payload: { accountLiquidity: liquidity }
          });
        }
      }
    },
    *queryPrice({ _ }, { call, put }){
      const network = store.get('network') ? store.get('network') : HADES_CONFIG.networks.test;
      let hades = (globals.hades = new Hades(network))
      const prices = yield hades.getPrices();
      yield put({
        type: 'savePrices',
        payload: { priceList: prices }
      });
    }
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
  },

})
