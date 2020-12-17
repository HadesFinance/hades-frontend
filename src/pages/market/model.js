import modelExtend from 'dva-model-extend'
import { model } from 'utils/model'
import { globals, launchTransaction, literalToReal, MAX_UINT256 } from '../../utils/constant';
import Hades from '../../utils/hades';
import store from 'store';


export default modelExtend(model, {
  namespace: 'market',
  state: {
    market:[],
    pageLoading: true
  },
  effects: {
    *queryMarket({ _ }, { call, put }) {
      const network = store.get('network');
      let hades = (globals.hades = new Hades(network))
      const markets = yield hades.getMarkets();
      for (const market of markets) {
        globals.hTokenMap.set(market.underlyingSymbol, market.hToken)
      }
      yield put({
        type: 'saveMarket',
        payload: { market: markets }
      });
      yield put({
        type: 'saveLoading',
        payload: { pageLoading: false}
      });
    },
    *queryAddress({ payload }, { call, put }) {
      let symbol = payload.symbol;
      const address = globals.hTokenMap.get(symbol);
      if (!symbol || !address) {
        alert('Please get symbol and hToken first!')
        throw new Error('Failed to get hToken address')
      }else {
        return address
      }
    },
    *getShowApprove({ payload }, { call, put }) {
      let { address, account, value } = payload;
      const dol = yield globals.hades.dol()
      const allowance = yield dol.allowance(account, address).call();
      const showApprove = allowance.toString() ==='0' || BigInt(allowance.toString()) < BigInt(value);
      return showApprove
    },
    *submitSupply({ payload }, { call, put }) {
      let { inputAmount, supplyBalanceInfo, symbol, address, showApprove } = payload;
      const value = yield literalToReal(inputAmount, supplyBalanceInfo.underlyingDecimals);
      const hToken = yield globals.hades.hToken(symbol, address)

      let tx;
      if (symbol === 'ETH') {
        tx = hToken.mint().send({ value, from: globals.loginAccount })
        yield launchTransaction(tx);
        yield put({
          type: 'queryMarket'
        });
      } else {
        if(showApprove){
          const dol = yield globals.hades.dol();
          yield dol.approve(address, MAX_UINT256).send({ from: globals.loginAccount })
        }
      }
    },
    *supplyDol({ payload }, { call, put }) {
      let { inputAmount, supplyBalanceInfo, symbol, address, } = payload;
      const value = yield literalToReal(inputAmount, supplyBalanceInfo.underlyingDecimals);
      const hToken = yield globals.hades.hToken(symbol, address)
      let tx
      tx = hToken.mint(value).send({ from: globals.loginAccount })
      yield launchTransaction(tx);
      yield put({
        type: 'queryMarket'
      });
    },
    },
  reducers: {
    saveMarket(state, { payload: { market } }) {
      return {
        ...state,
        market,
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
