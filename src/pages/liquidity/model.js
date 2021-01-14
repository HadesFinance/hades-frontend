import { parse } from 'qs'
import modelExtend from 'dva-model-extend'
import { model } from 'utils/model'
import api from 'api'
import { globals, launchTransaction, literalToReal, MAX_UINT256 } from '../../utils/constant';
import Hades from '../../utils/hades';
import store from 'store';
const { queryLiquidatingList } = api;


export default modelExtend(model, {
  namespace: 'liquidity',
  state: {
    liquidityList:[
      {
        "account":"0x7ace39E63B5f234cFB6D3239Ea326738B88677Cb",
        "collaterals":{
          "hETH":2,
          "hDOL":0,
        },
        "borrows":{
          "hETH":0,
          "hDOL":400.00039639,
        },
        "liquidity":200.07896303,
        "updatedAt":1609736333351,
        "_id":"RK8mnRwF2yd6yZbc",
        "selectedBalanceSymbol":'hETH',
        "selectedBorrowSymbol": 'hETH'
      },{
        "account":"0x2F81c61bc7daBc612757cF60D8a546637fc59359",
        "collaterals":{
          "hETH":0.5,
          "hDOL":450,
        },
        "borrows":{
          "hETH":0.5001657513264255,
          "hDOL":0,
        },
        "liquidity":287.45353946,
        "updatedAt":1609736333852,
        "_id":"odB3RulRV5Gu0dHn",
        "selectedBalanceSymbol":'hETH',
        "selectedBorrowSymbol": 'hETH'
      },{
        "account":"0xf959579eDf47f166f316Bc03887540D5d80AA302",
        "collaterals":{
          "hETH":1.99999987,
        },
        "borrows":{
          "hETH":0,
        },
        "liquidity":-600.07932041,
        "updatedAt":1609736330745,
        "_id":"NnH2t0jwgM3vxnoD",
        "selectedBalanceSymbol":'hETH',
        "selectedBorrowSymbol": 'hETH'
      },{
        "account":"0x48D6c33eE6BD128751e71Ce1B32D2bEF27AbD709",
        "collaterals":{
          "hETH":9,
          "hDOL":0,
        },
        "borrows":{
          "hETH":0,
          "hDOL":2000.00198195,
        },
        "liquidity":700.35513544,
        "updatedAt":1609736332750,
        "_id":"rcCQdHu8wQsbT22p",
        "selectedBalanceSymbol":'hETH',
        "selectedBorrowSymbol": 'hETH'
      },{
        "account":"0xc068577fA749F8B17ab87901151A7C0ff9651a2A",
        "collaterals":{
          "hETH":12.99999907,
          "hDOL":0,
        },
        "borrows":{
          "hETH":3.126027476097089,
          "hDOL":1.00000068,
        },
        "liquidity":2649.10456609,
        "updatedAt":1609736335757,
        "_id":"VpdJtEgeOG8Ub0ri",
        "selectedBalanceSymbol":'hETH',
        "selectedBorrowSymbol": 'hETH'
      },{
        "account":"0x5661cdBc2Ff8ffC5eC8f0fb1F551443CE3068ed4",
        "collaterals":{
          "hETH":9.99999985,
          "hDOL":309.99999995,
        },
        "borrows":{
          "hETH":0,
          "hDOL":500.00049546,
        },
        "liquidity":2732.89625669,
        "updatedAt":1609736334555,
        "_id":"UZ8J6i6gtSjzNIlb",
        "selectedBalanceSymbol":'hETH',
        "selectedBorrowSymbol": 'hETH'
      }, {
        "account": "0x484ca440aDFa0b7A148169342B9d8E4623Ab2D53",
        "collaterals": { "hETH": 9.99867751, "hDOL": 999.99999958 },
        "borrows": { "hETH": 0, "hDOL": 1000.00000017 },
        "liquidity": 2749.99999745,
        "updatedAt": 1609736337461,
        "_id": "9I54LzgT17NdvMRr",
        "selectedBalanceSymbol": 'hETH',
        "selectedBorrowSymbol": 'hETH'
      }
    ],
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
      const underlyingAddress = globals.hades._marketInfo[repaySymbol].underlyingAssetAddress
      console.log('demoLiquidate underlyingAddress', underlyingAddress)

      const erc20Token = yield globals.hades.underlyingToken(underlyingAddress)
      const repayTokenAddress = globals.hades._marketInfo[repaySymbol].hToken
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
