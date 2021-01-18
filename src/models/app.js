/* global window */

import { history } from 'umi'
import store from 'store'
import { CANCEL_REQUEST_MESSAGE } from 'utils/constant'
import api from 'api'
import { HADES_CONFIG } from '../../config';
import {database} from '../../mock/route'
import overview from '../../public/overview.svg'
import overview_p from '../../public/overview_p.svg'
import market from '../../public/market.svg'
import market_p from '../../public/market_p.svg'
import mining from '../../public/mining.svg'
import mining_p from '../../public/mining_p.svg'
import voting from '../../public/voting.svg'
import voting_p from '../../public/voting_p.svg'
import account from '../../public/account.svg'
import account_p from '../../public/account_p.svg'
import liquidity from '../../public/liquidity.svg'
import liquidity_p from '../../public/liquidity_p.svg'
import { globals } from '../utils/constant';
import RealDAOService from '../services/realdao'

const { pathToRegexp } = require("path-to-regexp")
const { queryRouteList, logoutUser } = api

const goDashboard = () => {
  if (pathToRegexp(['/', '/login']).exec(window.location.pathname)) {
    history.push({
      pathname: '/dashboard',
    })
  }
}

export default {
  namespace: 'app',
  state: {
    routeList:[],
    locationPathname: '',
    locationQuery: {},
    theme: store.get('theme') || 'light',
    collapsed: store.get('collapsed') || false,
  },
  effects: {
    *query({ payload }, { call, put, select }) {
      // store isInit to prevent query trigger by refresh
      let routeList = [
        {
          id: '1',
          icon: overview,
          activeIcon: overview_p,
          name: 'Overview',
          'pt-br': {
            name: 'Overview'
          },
          route: '/dashboard',
        },{
          id: '2',
          icon: market,
          activeIcon: market_p,
          name: 'Market',
          'pt-br': {
            name: 'Market'
          },
          route: '/market',
        },{
          id: '3',
          icon: mining,
          activeIcon: mining_p,
          name: 'Mining',
          'pt-br': {
            name: 'Mining'
          },
          route: '/mining',
        },{
          id: '4',
          icon: voting,
          activeIcon: voting_p,
          name: 'Council',
          'pt-br': {
            name: 'Council'
          },
          route: '/council',
        },{
          id: '5',
          icon: liquidity,
          activeIcon: liquidity_p,
          name: 'Liquidation',
          'pt-br': {
            name: 'Liquidation'
          },
          route: '/liquidity',
        },{
          id: '6',
          icon: account,
          activeIcon: account_p,
          name: 'Account',
          'pt-br': {
            name: 'Account'
          },
          route: '/account',
        },
      ];
      const network = HADES_CONFIG.networks.dev
      globals.realDAO = new RealDAOService({
        config: {
          env: 'dev',
          provider: window.web3.currentProvider || 'ws://158.247.223.174:8545',
          orchestrator: '0x8598E72d1B8955141207B6325a427A17910195F6'
        }
      });
      globals.realDAO.loadRTokens()
      yield put({
        type: 'handleConfigChange',
        payload: { routeList: routeList, network: network, isInit: true}
      });
    },

    *signOut({ payload }, { call, put }) {
      const data = yield call(logoutUser)
      if (data.success) {
        store.set('routeList', [])
        store.set('permissions', { visit: [] })
        store.set('user', {})
        store.set('isInit', false)
        yield put({ type: 'query' })
      } else {
        throw data
      }
    },
  },
  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload,
      }
    },

    handleThemeChange(state, { payload }) {
      store.set('theme', payload)
      state.theme = payload
    },

    handleCollapseChange(state, { payload }) {
      store.set('collapsed', payload)
      state.collapsed = payload
    },

    allNotificationsRead(state) {
      state.notifications = []
    },
    handleConfigChange(state,{ payload}) {
      store.set('routeList',payload.routeList);
      store.set('network',payload.network);
      store.set('isInit',payload.isInit);
      state.routeList = payload.routeList;
      goDashboard()
    }
  },
}
