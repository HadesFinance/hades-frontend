import modelExtend from 'dva-model-extend'
import { model } from 'utils/model'
import { globals} from '../../utils/constant';
import Hades from '../../utils/hades';
import store from 'store';


export default modelExtend(model, {
  namespace: 'overview',
  state: {
    overview: {
      totalBorrowsAccLiteral:0,
      totalReservesAccLiteral:0,
      totalSupplyAccLiteral:0,
      dol:{
        totalSupply:0
      },
      hds:{
        circulating:0,
        mined:0
      },
      markets:[
        {
          totalBorrowsAccLiteral:0.0,
          totalReservesAccLiteral:0.0,
          totalSupplyAccLiteral:0.0,
        },{
          totalBorrowsAccLiteral:0,
          totalReservesAccLiteral:0,
          totalSupplyAccLiteral:0,
        }
      ]
    }
  },
  effects: {
    *queryOverview({ _ }, { call, put }) {
      const network = store.get('network');
      let hades = (globals.hades = new Hades(network))
      let that = this;
      const result = yield hades.getOverview();
      console.log(result)
      yield put({
        type: 'saveOverview',
        payload: { overview: result }
      });
    },
  },
  reducers: {
    saveOverview(state, { payload: { overview } }) {
      return {
        ...state,
        overview,
      }
    },
  },

})
