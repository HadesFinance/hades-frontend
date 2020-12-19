import modelExtend from 'dva-model-extend'
import { model } from 'utils/model'
import {HADES_CONFIG} from '../../../config'
import { globals, launchTransaction, literalToReal, realToLiteral } from '../../utils/constant';
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
      rewardsPerBlockLiteral:0
    },
    pageLoading: true
  },
  effects: {
    *queryMining({ _ }, { call, put }) {
      let hades = globals.hades;
      if(hades){
        let loginAcount = globals.loginAccount;
        if(loginAcount){
          const result = yield hades.getPools(loginAcount);
          yield put({
            type: 'saveMining',
            payload: { mining: result }
          });
          yield put({
            type: 'saveLoading',
            payload: { pageLoading: false}
          })
          console.log('refresh mining,unclaimed='+result.my[0].unclaimedLiteral)
          return result
        }else {
          const result = yield hades.getPools();
          for (const pool of result.pools) {
            globals.lpTokenMap.set(pool.id, pool.tokenAddr)
          }
          yield put({
            type: 'saveMining',
            payload: { mining: result }
          });
          yield put({
            type: 'saveLoading',
            payload: { pageLoading: false}
          })
          return result
        }
      }
    },
    *queryDistributorStats({ _ }, { call, put }) {
      const result = yield globals.hades.getDistributorStats();
      yield put({
        type: 'saveDistributorStats',
        payload: { distributorStats: result }
      });
    },
    *queryIncreaseResults({ payload }, { call, put }) {
      let { pid } = payload;
      const lpTokenAddr = yield globals.lpTokenMap.get(pid)
      if (!lpTokenAddr) {
        return alert('failed to get lp token address')
      }
      const lpToken = yield globals.hades.lpToken(lpTokenAddr);
      const results = yield Promise.all([
        lpToken.balanceOf(globals.loginAccount).call(),
        lpToken.decimals().call(),
        globals.hades.distributor(),
      ]);
      const balanceLiteral = yield realToLiteral(results[0], results[1]);

      let res = { results: results, lpToken: lpToken, balanceLiteral: balanceLiteral}
      return res
    },
    *getShowApprove({ payload }, { call, put }) {
      let { lpToken,distributor,value } = payload;
      const allowance = yield lpToken.allowance(globals.loginAccount, distributor._address).call()
      let showApprove = allowance.toString() ==='0' || BigInt(allowance.toString()) < BigInt(value);
      return showApprove
    },
    *submitIncrease({ payload }, { call, put }) {
      let { increaseResult,pid,inputAmount } = payload;
      const realAmount = yield literalToReal(inputAmount, increaseResult[1]);
      yield launchTransaction(increaseResult[2].mintExchangingPool(pid, realAmount).send({ from: globals.loginAccount }))
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
    saveLoading(state, { payload: { pageLoading } }) {
      return {
        ...state,
        pageLoading,
      }
    },
  },

})
