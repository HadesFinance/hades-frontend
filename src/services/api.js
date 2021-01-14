import store from 'store';
const network = store.get('network');
export default {
  queryRouteList: '/routes',
  queryDashboard: '/dashboard',
  queryLiquidatingList: '/potential_liquidations',
  queryCouncilList: '/council_proposals',
  queryCouncilDetail: '/council_proposal/:id'
}
