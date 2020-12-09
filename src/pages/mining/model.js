import modelExtend from 'dva-model-extend'
import { model } from 'utils/model'
import {HADES_CONFIG} from '../../../config'
import { globals} from '../../utils/constant';
import Hades from '../../utils/hades';
import store from 'store';


export default modelExtend(model, {
  namespace: 'mining',
  state: {
    mining:{
      my:[],
      pools:[]
    },
    distributorStats:{
      activePools: "0",
      mineStartBlock: "0",
      nextHalvingBlock: "0",
      rewardsPerBlock: "0",
      totalPools: "0",
    }
  },
  effects: {
    *queryMining({ _ }, { call, put }) {
      const network = store.get('network');
      let hades = (globals.hades = new Hades(network))
      let loginAcount = globals.loginAccount;
      if(loginAcount){
        const result = yield hades.getPools(loginAcount);
        console.log(result);
        yield put({
          type: 'saveMining',
          payload: { mining: result }
        });
        return result
      }else {
        const result = yield hades.getPools();
        console.log(result);
        for (const pool of result.pools) {
          globals.lpTokenMap.set(pool.id, pool.tokenAddr)
        }
        yield put({
          type: 'saveMining',
          payload: { mining: result }
        });
        return result
      }
    },
    *queryDistributorStats({ _ }, { call, put }) {
      const result = yield globals.hades.getDistributorStats();
      yield put({
        type: 'saveDistributorStats',
        payload: { distributorStats: result }
      });
    },
  },
  reducers: {
    saveMining(state, { payload: { mining } }) {
      return {
        ...state,
        mining,
      }
    },
    saveDistributorStats(state, { payload: { distributorStats } }) {
      return {
        ...state,
        distributorStats,
      }
    },
  },

})
