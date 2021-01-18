import modelExtend from 'dva-model-extend'
import { model } from 'utils/model'
import { globals, launchTransaction, literalToReal, MAX_UINT256 } from '../../utils/constant';


export default modelExtend(model, {
  namespace: 'market',
  state: {
    market:[],
    pageLoading: true
  },
  effects: {
    *queryMarket({ _ }, { call, put }) {
      let realDAO = globals.realDAO;
      if (realDAO) {
      const markets = yield realDAO.getMarkets();
      for (const market of markets) {
        globals.rTokenMap.set(market.underlyingSymbol, market.rToken)
      }
      yield put({
        type: 'saveMarket',
        payload: { market: markets }
      });
      yield put({
        type: 'saveLoading',
        payload: { pageLoading: false }
      });
    }
    },
    *queryAddress({ payload }, { call, put }) {
      let symbol = payload.symbol;
      const address = globals.rTokenMap.get(symbol);
      if (!symbol || !address) {
        alert('Please get symbol and rToken first!')
        throw new Error('Failed to get rToken address')
      }else {
        return address
      }
    },
    *getShowApprove({ payload }, { call, put }) {
      let { address, account, value } = payload;
      const dol = yield globals.realDAO.dol()
      const allowance = yield dol.allowance(account, address).call();
      const showApprove = allowance.toString() ==='0' || BigInt(allowance.toString()) < BigInt(value);
      return showApprove
    },
    *submitSupply({ payload }, { call, put }) {
      let { inputAmount, supplyBalanceInfo, symbol, address, showApprove } = payload;
      const value = yield literalToReal(inputAmount, supplyBalanceInfo.underlyingDecimals);
      const rToken = yield globals.realDAO.rToken(symbol)

      let tx;
      if (symbol === 'ETH') {
        tx = rToken.mint().send({ value, from: globals.loginAccount })
        yield launchTransaction(tx);
        yield put({
          type: 'queryMarket'
        });
      } else {
        if(showApprove){
          const dol = yield globals.realDAO.dol();
          yield dol.approve(address, MAX_UINT256).send({ from: globals.loginAccount})
        }
      }
    },
    *supplyDol({ payload }, { call, put }) {
      let { inputAmount, supplyBalanceInfo, symbol, address, } = payload;
      const value = yield literalToReal(inputAmount, supplyBalanceInfo.underlyingDecimals);
      const rToken = yield globals.realDAO.rToken(symbol)
      let tx
      tx = rToken.mint(value).send({ from: globals.loginAccount })
      yield launchTransaction(tx);
      yield put({
        type: 'queryMarket'
      });
    },
    *queryBorrowResult({ payload }, { call, put }) {
      let { symbol,account,address } = payload;
      const results = yield Promise.all([
        globals.realDAO.getRTokenBalances(address, account),
        globals.realDAO.getPrice(symbol),
        globals.realDAO.getAccountLiquidity(account),
        globals.realDAO.rToken(symbol),
      ]);
      let borrowLimit;
      if (symbol !== 'DOL') {
        borrowLimit = results[2].liquidity / Number(results[1].underlyingPrice)
      } else {
        borrowLimit = results[2].liquidityLiteral
      }
      let res = { results: results, borrowLimit: borrowLimit}
      return res
    },
    *submitBorrow({ payload }, { call, put }) {
      let { results, inputAmount } = payload;
      const realAmount = yield literalToReal(inputAmount, results[0].underlyingDecimals);
      const rToken = results[3];
      yield launchTransaction(rToken.borrow(realAmount).send({ from: globals.loginAccount }));
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
