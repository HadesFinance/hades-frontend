import modelExtend from 'dva-model-extend'
import { model } from 'utils/model'
import { globals} from '../../utils/constant';


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
      rds:{
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
    },
    pageLoading: true
  },
  effects: {
    *queryOverview({ _ }, { call, put }) {
      let realDAO = globals.realDAO;
      if(realDAO){
        const result = yield realDAO.getOverview();
        yield put({
          type: 'saveOverview',
          payload: { overview: result }
        });
        yield put({
          type: 'saveLoading',
          payload: { pageLoading: false}
        })
      }
    },
  },
  reducers: {
    saveOverview(state, { payload: { overview } }) {
      return {
        ...state,
        overview,
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
