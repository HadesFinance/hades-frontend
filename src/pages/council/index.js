import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect, withRouter } from 'umi';
import { Row, Col, Card, Popover, Table } from 'antd';
import { Page, } from 'components'
import { history } from 'umi'
import styles from './index.less'
import { LoadingOutlined, InfoCircleOutlined, LeftCircleFilled, RightCircleFilled } from '@ant-design/icons';
import member_avatar1 from '../../../public/member_avatar1.svg'
import member_avatar2 from '../../../public/member_avatar2.svg'
import member_avatar3 from '../../../public/member_avatar3.svg'
import member_avatar4 from '../../../public/member_avatar4.svg'
import member_avatar5 from '../../../public/member_avatar5.svg'
import member_avatar6 from '../../../public/member_avatar6.svg'
import linkGray from '../../../public/link_gray.svg';
import linkGreen from '../../../public/link_green.svg';
import store from 'store';
import appStyles from '../app.less';
import { globals } from '../../utils/constant';

@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class Council extends PureComponent {
  state = {
    pageLoading: false,
    councilList:[{"pid":1,"target":"0x5661cdBc2Ff8ffC5eC8f0fb1F551443CE3068ed4","value":"0","signature":"set()","params":"","proposer":"0x5661cdBc2Ff8ffC5eC8f0fb1F551443CE3068ed4","startBlock":"194415","endBlock":"244415","desc":"hello","eta":"0","state":1,"_id":"wFbcmKo9YTL43KqN"}],
    selectedNavList:[
      {
        text: 'all',
        status: true
      },{
        text: 'pending',
        status: false
      },{
        text: 'queued',
        status: false
      },{
        text: 'executed',
        status: false
      }
    ],
    current:1,
    councilCount:11,
    selectedNavIndex:0,
    proposalState:['All','Pending','Rejected','Expired','Queued','Canceled','Executed'],
    avatarList:[member_avatar1,member_avatar2,member_avatar3,member_avatar4,member_avatar5,member_avatar6]
  };

  componentDidMount() {
    this.props.dispatch({
      type: 'council/queryMembers'
    });
    this.props.dispatch({
      type: 'council/queryCouncil',
      payload: { state: 'all', offset: 0, limit: 10}
    })
  }

  componentWillUnmount() {
  }


  columns = [{
    title: 'ID',
    dataIndex: 'id',
    render: (_, { pid}) => {
      return (
        <div className={styles.nameArea}>
          <span style={{cursor: 'pointer'}} onClick={() => this.goDetail(pid)}>{pid}</span>
        </div>
      );
    },
  },
    {
      title: 'Target',
      dataIndex: 'target',
      render: (_, { target}) => {
        let leftStr = target.slice(0,6);
        let rightStr = target.slice(target.length -6);
        const network = store.get('network');
        let etherscan = network.etherscan;
        let processedAccount = leftStr + '...'+ rightStr;
        let etherscanLink = 'https://'+etherscan+'/address/'+target
        return (
          <div className={styles.nameArea}>
            <span>{processedAccount}</span>
            <a href={etherscanLink} className={styles.addressLink}><img src={linkGreen}/> </a>
          </div>
        );
      },
    },
    {
      title: 'Signature',
      dataIndex: 'signature',
      render: (_, { signature}) => {
        return (
          <div className={styles.nameArea}>
            <span>{signature}</span>
          </div>
        );
      },
    },
    {
      title: 'Value',
      dataIndex: 'value',
      render: (_, { value }) => {
        return (
          <div className={styles.nameArea}>
            <span>{parseInt(value).toFixed(2)} ETH</span>
          </div>
        );
      },
    },{
      title: 'State',
      dataIndex: 'state',
      render: (_, { state}) => {
        return (
          <div className={styles.nameArea}>
            <span>{this.state.proposalState[state]}</span>
          </div>
        );
      },
    },{
      title: 'Start Block',
      dataIndex: 'start_block',
      render: (_, { startBlock}) => {
        return (
          <div className={styles.nameArea}>
            <span>{startBlock}</span>
          </div>
        );
      },
    },{
      title: 'End Block',
      dataIndex: 'end_block',
      render: (_, { endBlock}) => {
        return (
          <div className={styles.nameArea}>
            <span>{endBlock}</span>
          </div>
        );
      },
    },{
      title: 'ETA',
      dataIndex: 'eta',
      render: (_, { eta}) => {
        return (
          <div className={styles.nameArea}>
            <span>{eta}</span>
          </div>
        );
      },
    },
  ];

  selectNav(index){
    let selectedNavList = [
      {
        text: 'all',
        status: false
      },{
        text: 'pending',
        status: false
      },{
        text: 'queued',
        status: false
      },{
        text: 'executed',
        status: false
      }
    ];
    selectedNavList[index].status = true;
    this.setState({
      selectedNavList: selectedNavList,
      selectedNavIndex: index,
      current:1
    })
    this.props.dispatch({
      type: 'council/queryCouncil',
      payload: { state: selectedNavList[index].text, offset:0, limit:10}
    })

  }

  goDetail(id){
    history.push({
      pathname: '/council/detail',
      query: {id: id}
    })
  }

  goAdd(){
    if(globals.loginAccount){
      history.push({
        pathname: '/council/addPropose',
        query: {}
      })
    }else {
      alert('Please connect the wallet')
    }
  }

  prevPage(){
    let { current, selectedNavIndex, selectedNavList } = this.state;
    this.props.dispatch({
      type: 'council/queryCouncil',
      payload: { state: selectedNavList[selectedNavIndex].text, offset:(current -2) *10, limit: 10 }
    })
    this.setState({
      current: current -1
    })
  }

  nextPage(){
    let { current,selectedNavIndex, selectedNavList } = this.state;
    this.props.dispatch({
      type: 'council/queryCouncil',
      payload: { state: selectedNavList[selectedNavIndex].text, offset:current *10, limit: 10 }
    })
    this.setState({
      current: current +1
    })
  }

  render() {
    const {  selectedNavList, current, avatarList  } = this.state;
    const { app, boardMembers,pageLoading, councilList,councilCount,} = this.props
    const { theme, } = app
    return (
      <Page
        // loading={loading.models.dashboard && sales.length === 0}
        className={theme === 'dark' ? styles.darkPage : styles.liquidity}
      >
        {!pageLoading ?
          <div>
            <div className={styles.memberList}>
              <p className={styles.topAreaTitle}>Council Members</p>
              {boardMembers.map((item,index) =>
                <Popover placement="bottom"
                         content={
                           <div className={styles.popoverContent}>
                             <div className={styles.walletName}>
                               <p className={styles.name}>{item.slice(0,6)}...{item.slice(item.length -6)}</p>
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
            <div className={styles.screen}>
              <div className={styles.screenArea}>
                <p className={selectedNavList[0].status ? styles.screenNavItemOn : styles.screenNavItem} onClick={this.selectNav.bind(this,0)}>All</p>
                <p className={selectedNavList[1].status ? styles.screenNavItemOn : styles.screenNavItem} onClick={this.selectNav.bind(this,1)}>Pending</p>
                <p className={selectedNavList[2].status ? styles.screenNavItemOn : styles.screenNavItem} onClick={this.selectNav.bind(this,2)}>Queued</p>
                <p className={selectedNavList[3].status ? styles.screenNavItemOn : styles.screenNavItem} onClick={this.selectNav.bind(this,3)}>Executed</p>
              </div>
              <div className={styles.proposeBtn} onClick={() => this.goAdd()}>Propose</div>
            </div>
            <Card
              bordered={false}
              bodyStyle={{
                padding: '0 25px',
              }}>
              <Table columns={this.columns} dataSource={councilList}  rowKey="pid" pagination={false} />
            </Card>
            <div className={theme === 'dark' ? appStyles.pageAreaDark : appStyles.pageArea}>
              <LeftCircleFilled className={current ===1 ? appStyles.disabledBtn : appStyles.prev} onClick={current ===1 ? null : this.prevPage.bind(this)} />
              <p className={appStyles.page}>Page {current} of {councilCount >0 ? Math.ceil(councilCount / 10) : '1'}</p>
              <RightCircleFilled className={(current === Math.ceil(councilCount / 10)) || councilCount ===0 ? appStyles.disabledBtn : appStyles.next}
                                 onClick={(current === Math.ceil(councilCount / 10)) || councilCount ===0 ? null : this.nextPage.bind(this)}
              />
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
    boardMembers: state.council.boardMembers,
    councilList: state.council.councilList,
    councilCount: state.council.councilCount,
    pageLoading: state.council.pageLoading
  };
}

export default connect(mapStateToProps)(Council);
