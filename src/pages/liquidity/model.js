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
    pageLoading: true,
    selectedBalanceList:['rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH'],
    selectedBorrowList:['rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH'],
  },
  effects: {
    *queryLiquidity({ payload }, { call, put }) {
      const data = yield call(queryLiquidatingList, payload)
      if(data.success){
        let result = data.result;
        let liquidityList = result.docs;
        for(let i=0; i<liquidityList.length;i++){
          liquidityList[i].selectedBalanceSymbol = 'rETH';
          liquidityList[i].selectedBorrowSymbol = 'rETH'
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
    },
    *updateBalance({ payload }, { call, put }) {
      let { selectedBalanceList } = payload;
      yield put({
        type: 'saveBalance',
        payload: { selectedBalanceList: selectedBalanceList}
      })
    },
    *updateBorrow({ payload }, { call, put }) {
      let { selectedBorrowList } = payload;
      yield put({
        type: 'saveBorrow',
        payload: { selectedBorrowList: selectedBorrowList}
      })
    },
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
    saveBalance(state, { payload: { selectedBalanceList } }) {
      return {
        ...state,
        selectedBalanceList
      }
    },
    saveBorrow(state, { payload: { selectedBorrowList } }) {
      return {
        ...state,
        selectedBorrowList
      }
    },
  },

})
