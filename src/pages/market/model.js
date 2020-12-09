import modelExtend from 'dva-model-extend'
import { model } from 'utils/model'
import { globals} from '../../utils/constant';
import Hades from '../../utils/hades';
import store from 'store';


export default modelExtend(model, {
  namespace: 'market',
  state: {
    market:[]
  },
  effects: {
    *queryMarket({ _ }, { call, put }) {
      const network = store.get('network');
      let hades = (globals.hades = new Hades(network))
      const markets = yield hades.getMarkets();
      console.log(markets);
      for (const market of markets) {
        globals.hTokenMap.set(market.underlyingSymbol, market.hToken)
      }
      yield put({
        type: 'saveMarket',
        payload: { market: markets }
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
  },

})
