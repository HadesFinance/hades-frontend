import { parse } from 'qs'
import modelExtend from 'dva-model-extend'
import { model } from 'utils/model'
import api from 'api'
import { globals, launchTransaction, literalToReal, MAX_UINT256 } from '../../utils/constant';
const { queryCouncilList, queryCouncilDetail } = api;


export default modelExtend(model, {
  namespace: 'council',
  state: {
    boardMembers:[],
    councilList:[],
    councilCount:0,
    pageLoading: true,
    detail_info: {},
    detailLoading: true
  },
  effects: {
    *queryMembers({ _ }, { call, put }) {
      console.log('queryMember')
      yield globals.realDAO.loadCouncil()
      const council = globals.realDAO.council()
      const members = yield council.getMembers().call()
      console.log('member:', members);
      yield put({
        type: 'saveMembers',
        payload: { boardMembers: members }
      })
    },
    *queryCouncil({ payload }, { call, put }) {
      console.log(payload)
      const data = yield call(queryCouncilList, payload)
      if(data.success){
        let result = data.result;
        let councilList = result.docs;
        yield put({
          type: 'saveCouncil',
          payload: { councilList: councilList, councilCount: result.count || 0}
        })
        yield put({
          type: 'saveLoading',
          payload: { pageLoading: false}
        })
      }
    },
    *addPropose({ payload }, { call, put }) {
      let { target, value, signature, delay, votingPeriod, desc, paramValues } = payload;
      console.log(paramValues);
      const paramsData = globals.realDAO.encodeParameters(signature, [])
      console.log('paramsData:', paramsData)
      yield globals.realDAO.loadCouncil()
      const council = globals.realDAO.council()
      const t = council
        .propose(target, value, signature, paramsData, delay, votingPeriod, desc)
        .send({ from: globals.loginAccount });
      const result = yield launchTransaction(t);
      return result
    },
    *queryProposalDetail({ payload }, { call, put }) {
      const result = yield call(queryCouncilDetail, payload);
      yield put({
        type: 'saveCouncilDetail',
        payload: { detail_info: result.result}
      });
      yield put({
        type: 'saveDetailLoading',
        payload: { detailLoading: false }
      })
    },
    *voteProposal({ payload }, { call, put }) {
      let { pid } = payload;
      console.log('demoVoteProposal proposalId', pid)
      yield globals.realDAO.loadCouncil()
      const council = globals.realDAO.council()
      yield launchTransaction(council.vote(pid).send({ from: globals.loginAccount }))
    },
    *executeProposal({ payload }, { call, put }) {
      let { pid } = payload;
      console.log('demoVoteProposal proposalId', pid)
      yield globals.realDAO.loadCouncil()
      const council = globals.realDAO.council()
      yield launchTransaction(council.execute(pid).send({ from: globals.loginAccount }))
    },
  },
  reducers: {
    saveMembers(state, { payload: { boardMembers } }) {
      return {
        ...state,
        boardMembers
      }
    },
    saveCouncil(state, { payload: { councilList, councilCount } }) {
      return {
        ...state,
        councilList,
        councilCount
      }
    },
    saveCouncilDetail(state, { payload: { detail_info } }) {
      return {
        ...state,
        detail_info
      }
    },
    saveLoading(state, { payload: { pageLoading } }) {
      return {
        ...state,
        pageLoading,
      }
    },
    saveDetailLoading(state, { payload: { detailLoading } }) {
      return {
        ...state,
        detailLoading,
      }
    },
  },

})
