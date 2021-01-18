import { parse } from 'qs'
import modelExtend from 'dva-model-extend'
import { model } from 'utils/model'
import api from 'api'
import { globals, launchTransaction, literalToReal, MAX_UINT256 } from '../../utils/constant';
const { queryLiquidatingList } = api;


export default modelExtend(model, {
  namespace: 'liquidity',
  state: {
    liquidityList:[],
    liquidityCount:0,
    pageLoading: true
  },
  effects: {
    *queryLiquidity({ payload }, { call, put }) {
      const data = yield call(queryLiquidatingList, payload)
      if(data.success){
        let result = data.result;
        let liquidityList = result.docs;
        for(let i=0; i<liquidityList.length;i++){
          liquidityList[i].selectedBalanceSymbol = 'hETH';
          liquidityList[i].selectedBorrowSymbol = 'hETH'
        }
        yield put({
          type: 'saveLiquidity',
          payload: { liquidityList: liquidityList, liquidityCount: result.count}
        })
        yield put({
          type: 'saveLoading',
          payload: { pageLoading: false}
        })
        return liquidityList
      }
    },
    *handleChangeBalance({ payload }, { call, put, select }) {
      let { index, value } = payload;
      let liquidityList = yield select(state => state.liquidity.liquidityList);
      let liquidityCount = yield select(state => state.liquidity.liquidityCount);
      let subList = [];
      for(let i=0; i<liquidityList.length;i++){
        subList[i] = liquidityList[i]
      }
      console.log(liquidityList[index].selectedBalanceSymbol)
      console.log(subList)
      subList[index].selectedBalanceSymbol = value;
      yield put({
        type: 'saveLiquidity',
        payload: { liquidityList: subList, liquidityCount: liquidityCount}
      })
    },
    *handleChangeBorrow({ payload }, { call, put, select }) {
      let { index, value } = payload;
      let liquidityList = yield select(state => state.liquidity.liquidityList);
      let liquidityCount = yield select(state => state.liquidity.liquidityCount);
      let subList = [...liquidityList];
      console.log(liquidityList[index].selectedBorrowSymbol)
      console.log(subList)
      subList[index].selectedBorrowSymbol = value;
      yield put({
        type: 'saveLiquidity',
        payload: { liquidityList: subList, liquidityCount: liquidityCount}
      })
    },
    *getShowApprove({ payload }, { call, put }) {
      let { repaySymbol,liquidateAmount } = payload;
      const liquidator = globals.loginAccount
      const underlyingAddress = globals.realDAO._marketInfo[repaySymbol].underlyingAssetAddress
      console.log('demoLiquidate underlyingAddress', underlyingAddress)

      const erc20Token = yield globals.realDAO.erc20Token(underlyingAddress)
      const repayTokenAddress = globals.realDAO._marketInfo[repaySymbol].rToken
      const allowance = yield erc20Token.allowance(liquidator, repayTokenAddress).call()
      console.log('demoLiquidate allowance:', allowance.toString())
      const showApprove = BigInt(allowance.toString()) < BigInt(liquidateAmount);
      return showApprove
    }
  },
  reducers: {
    saveLiquidity(state, { payload: { liquidityList, liquidityCount } }) {
      return {
        ...state,
        liquidityList,
        liquidityCount
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
