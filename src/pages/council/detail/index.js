import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect, withRouter } from 'umi';
import { Row, Col, Card, Popover, Table } from 'antd';
import { Page, } from 'components'
import styles from './index.less'
import { history } from 'umi'
import { LoadingOutlined, LeftOutlined, ClockCircleFilled } from '@ant-design/icons'
import linkGray from '../../../../public/link_gray.svg';
import linkGreen from '../../../../public/link_green.svg';
import eth from '../../../../public/ETH.svg';
import member_avatar1 from '../../../../public/member_avatar1.svg'
import member_avatar2 from '../../../../public/member_avatar2.svg'
import member_avatar3 from '../../../../public/member_avatar3.svg'
import member_avatar4 from '../../../../public/member_avatar4.svg'
import member_avatar5 from '../../../../public/member_avatar5.svg'
import member_avatar6 from '../../../../public/member_avatar6.svg'
import store from 'store';
import { globals } from '../../../utils/constant';

@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class CouncilDetail extends PureComponent {
  state = {
    detailLoading: false,
    detail_info:{
      proposal:{
      "pid":1,
      "target":"0x5661cdBc2Ff8ffC5eC8f0fb1F551443CE3068ed4",
      "value":"0",
      "signature":"set()",
      "params":"",
      "proposer":"0x5661cdBc2Ff8ffC5eC8f0fb1F551443CE3068ed4",
      "startBlock":"194415",
      "endBlock":"244415",
      "desc":"hello",
      "eta":"0",
      "state":1,
      "_id":"wFbcmKo9YTL43KqN"
    },
     voters:[]
    },
    proposalState:['All','Pending','Rejected','Expired','Queued','Canceled','Executed'],
    avatarList:[member_avatar1,member_avatar2,member_avatar3,member_avatar4,member_avatar5,member_avatar6]
  };

  componentDidMount() {
    const { query = {} } = this.props.location;
    let id = query.id;
    this.props.dispatch({
      type: 'council/queryProposalDetail',
      payload: { id: id}
    })
  }

  componentWillUnmount() {
  }

  goBack(){
    history.push({
      pathname: '/council',
      query: {}
    })
  }

  voteProposal(){
    if(globals.loginAccount){
      let detail_info = this.props.detail_info;
      this.props.dispatch({
        type: 'council/voteProposal',
        payload: { pid: detail_info.proposal.pid }
      })
    }else {
      alert('Please connect the wallet')
    }
  }

  executeProposal(){
    if(globals.loginAccount){
      let detail_info = this.props.detail_info;
      this.props.dispatch({
        type: 'council/executeProposal',
        payload: { pid: detail_info.proposal.pid }
      })
    }else {
      alert('Please connect the wallet')
    }
  }

  render() {
    const {  proposalState,avatarList } = this.state;
    const { app,detail_info,detailLoading,  } = this.props
    const { theme, } = app
    return (
      <Page
        // loading={loading.models.dashboard && sales.length === 0}
        className={theme === 'dark' ? styles.darkPage : styles.liquidity}
      >
        {!detailLoading ?
          <div>
            <div className={styles.pageTitle}>
              <LeftOutlined style={{fontSize: 14+'px',color: '#808191',cursor: 'pointer'}} onClick={() => this.goBack()} />
              <span className={styles.detailId}>{detail_info.proposal.pid}</span>
              <div className={styles.statusArea}>
                <ClockCircleFilled style={{fontSize: 10+'px',color: '#fff'}} />
                <span className={styles.status}>{proposalState[detail_info.proposal.state]}</span>
              </div>
            </div>
            <div className={styles.detailInfo}>
              <div className={styles.valueArea}>
                <img src={eth} className={styles.ethImg}/>
                <span>{detail_info.proposal.value} ETH</span>
              </div>
              <Row lg={24} className={[styles.tableInfo,theme === 'dark' ? styles.tableInfoDark : '']}>
                <Col lg={18}>
                  <Row lg={24} className={styles.title}>Target</Row>
                  <Row lg={24} className={styles.valueBig}>{detail_info.proposal.target}<img src={linkGreen}/> </Row>
                  <Row lg={24} className={styles.title}>Signature</Row>
                  <Row lg={24} className={styles.valueBig}>{detail_info.proposal.signature}</Row>
                </Col>
                <Col lg={6}>
                  <Row lg={24} className={styles.rightRow}>
                    <span className={styles.title}>Start Block</span>
                    <span className={styles.value}>{detail_info.proposal.startBlock}</span>
                  </Row>
                  <Row lg={24} className={styles.rightRow}>
                    <span className={styles.title}>End Block</span>
                    <span className={styles.value}>{detail_info.proposal.endBlock}</span>
                  </Row>
                  <Row lg={24} className={styles.rightRow}>
                    <span className={styles.title}>ETA</span>
                    <span className={styles.value}>{detail_info.proposal.eta}</span>
                  </Row>
                </Col>
              </Row>
              <div className={styles.paramsArea}>
                <p className={styles.detailTitle}>Parameters</p>
                {detail_info.proposal.params !=='' && detail_info.proposal.params.length >0 ?
                  <div className={styles.params}>
                    {detail_info.proposal.params.map((item,index) =>
                      <p className={styles.paramItem} key={index}>{item}</p>
                    )}
                  </div> : ''
                }
              </div>
              <div className={styles.proposerArea}>
                <p className={styles.detailTitle}>Proposer:</p>
                <div className={styles.proposer}>
                  <img src={avatarList[5]} className={styles.proposerAvatar}/>
                  <span>{detail_info.proposal.proposer.slice(0,6)}...{detail_info.proposal.proposer.slice(detail_info.proposal.proposer.length -6)}</span>
                  <a href={'https://'+store.get('network').etherscan+'/address/'+detail_info.proposal.proposer}><img src={linkGreen} className={styles.link}/></a>
                </div>
              </div>
              <div className={styles.memberArea}>
                <p className={styles.detailTitle}>Voter:</p>
                <div className={styles.memberList}>
                  {detail_info.voters.map((item,index) =>
                    <Popover placement="bottom"
                             content={
                               <div className={styles.popoverContent}>
                                 <div className={styles.walletName}>
                                   <p className={styles.name}>{item}</p>
                                   <a href={'https://'+store.get('network').etherscan+'/address/'+item} className={styles.linkArea}>
                                     <span>View on Etherscan</span>
                                     <img src={linkGray}/>
                                   </a>
                                 </div>
                               </div>
                             }
                             overlayClassName={styles.popoverContainer}
                             trigger="hover"
                             key={index}>
                      <img src={avatarList[(index % 6)]} className={styles.memberAvatar}/>
                    </Popover>
                  )}
                </div>
              </div>
              <div className={styles.btnList}>
                <div className={styles.btnItem} onClick={this.voteProposal.bind(this)}>Vote</div>
                <div className={styles.btnItem} onClick={this.executeProposal.bind(this)}>Execute</div>
              </div>
            </div>
          </div> :
          <div className={styles.loading}>
            <div>
              <LoadingOutlined/>
              <span>loading</span>
            </div>
          </div>
        }
      </Page>
    )
  }
}

function mapStateToProps(state) {
  return {
    detail_info: state.council.detail_info,
    detailLoading: state.council.detailLoading
  };
}

export default connect(mapStateToProps)(CouncilDetail);
