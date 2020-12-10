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
    routeList:[
      {
        id: '1',
        icon: '/overview.svg',
        activeIcon: '/overview_p.svg',
        name: 'Overview',
        'pt-br': {
          name: 'Overview'
        },
        route: '/dashboard',
      },{
        id: '2',
        icon: '/market.svg',
        activeIcon: '/market_p.svg',
        name: 'Market',
        'pt-br': {
          name: 'Market'
        },
        route: '/market',
      },{
        id: '3',
        icon: '/mining.svg',
        activeIcon: '/mining_p.svg',
        name: 'Mining',
        'pt-br': {
          name: 'Mining'
        },
        route: '/mining',
      },{
        id: '4',
        icon: '/voting.svg',
        activeIcon: '/voting_p.svg',
        name: 'Voting',
        'pt-br': {
          name: 'Voting'
        },
        route: '/voting',
      },{
        id: '5',
        icon: '/account.svg',
        activeIcon: '/account_p.svg',
        name: 'Account',
        'pt-br': {
          name: 'Account'
        },
        route: '/account',
      },
    ],
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
          name: 'Voting',
          'pt-br': {
            name: 'Voting'
          },
          route: '/voting',
        },{
          id: '5',
          icon: account,
          activeIcon: account_p,
          name: 'Account',
          'pt-br': {
            name: 'Account'
          },
          route: '/account',
        },
      ];
      const network = HADES_CONFIG.networks.test;
  /*    store.set('routeList', routeList);
      store.set('isInit', true);
      const network = HADES_CONFIG.networks.test;
      store.set('network',network);



      const isInit = store.get('isInit')
      if (isInit) {
        goDashboard()
        return
      }*/
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
