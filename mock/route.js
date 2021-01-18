export const database =
  [
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
    icon: '/council.svg',
    activeIcon: '/voting_p.svg',
    name: 'Voting',
    'pt-br': {
      name: 'Voting'
    },
    route: '/council',
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
]
//module.exports = database

/*module.exports = {
  [`GET ${ApiPrefix}/routes`](req, res) {
    res.status(200).json(database)
  },
}*/
