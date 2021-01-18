import React, {PureComponent} from 'react'
import { connect, withRouter } from 'umi';
import { Row,  Card, Button, Input, Modal, Form } from 'antd';
import {
  ClockCircleOutlined, LoadingOutlined,
} from '@ant-design/icons';
import { Page, } from 'components'
import styles from './index.less'
import appStyles from '../app.less'
import { NumberCard } from '../dashboard/components';
import exchange from '../../../public/exchanging.svg';
import lending from '../../../public/lending.svg'
import linkBlack from '../../../public/link_black.svg'
import linkWhite from '../../../public/link_white.svg'
import { TableInfo, Countdown } from './components/'
import { globals, MAX_UINT256, literalToReal, launchTransaction, realToLiteral,init } from '../../utils/constant';
const FormItem = Form.Item;


@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class Mining extends PureComponent {
  state = {
    increaseVisible: false,
    claimVisible: false,
    exitVisible: false,
    countdownList:[],
    countdown:'',
    selectedPoolItem: {},
    increaseLimit:'',
    checkMax: false,
    increaseResults:[],
    lpToken:'',
    power:'',
    rewards:'',
    lockEnable:false,
    showApprove: false,
  };

  componentDidMount() {
    let that = this
    that.getMining();
    that.refreshMining = setInterval(function() {
      that.getMining()
    },15000);

  }

  componentWillUnmount() {
    clearInterval(this.refreshMining)
  }

  getMining(){
    let that = this;
    that.props.dispatch({
      type: 'mining/queryMining'
    });
    that.props.dispatch({
      type: 'mining/queryDistributorStats'
    })
  }

  showModal = async (item) => {
    let account = (globals.loginAccount = window.ethereum.selectedAddress);
    if(item.ptype ===1 && account){
      this.setState({
        increaseVisible: true,
      });
    }else if(item.ptype ===2 && account){
      this.setState({
        claimVisible: true,
        selectedPoolItem: item
      });
      let that = this;
      await this.props.dispatch({
        type: 'mining/queryIncreaseResults',
        payload: {pid: item.id}
      }).then((res) =>{
        let { results, lpToken, balanceLiteral } = res;
        const distributor = results[2]
        let showApprove = that.props.dispatch({
          type: 'mining/getShowApprove',
          payload: { lpToken: lpToken, distributor: distributor,value: 0}
        })
        that.setState({
          increaseLimit: balanceLiteral,
          increaseResult: results,
          lpToken: lpToken,
          showApprove: showApprove
        })
      })
    }else if(!account){
      alert('Please connect the wallet')
    }
  };

  handleIncreaseApprove = async (e) => {
    let { increaseResult, lpToken,showApprove } = this.state;
    const form = this.refs.myForm;
    const values = form.getFieldsValue(['increaseInput'])
    let inputAmount = values.increaseInput;
    if(inputAmount !==undefined){
      const distributor = increaseResult[2]
      if(showApprove){
        await lpToken.approve(distributor._address, MAX_UINT256).send({ from: globals.loginAccount });
        this.setState({
          lockEnable: true
        })
      }else {
        let that = this;
        that.setState({
          lockEnable: true
        },function() {
          that.handleIncreaseOk()
        })
      }
    }
  };

  handleIncreaseOk = async (e) => {
    let { increaseResult,  selectedPoolItem,lockEnable, showApprove } = this.state;
    if(lockEnable || !showApprove){
      const form = this.refs.myForm;
      const values = form.getFieldsValue(['increaseInput'])
      let inputAmount = values.increaseInput;
      if(inputAmount !==undefined){
        let that = this;
        that.props.dispatch({
          type: 'mining/submitIncrease',
          payload: { increaseResult: increaseResult,pid: selectedPoolItem.id, inputAmount: inputAmount}
        }).then(() =>{
          that.setState({
            claimVisible: false,
            checkMax: false,
            lockEnable: false
          })
          that.getMining()
        })
      }
    }else {
      alert('please approve first')
    }
  };

  handleIncreaseCancel = (e) => {
    this.setState({
      claimVisible: false,
      checkMax: false,
    })
  }

  handleIncreaseChange = async (e) => {
    let inputValue = e.target.value;
    if(inputValue !==null){
      let { lpToken, increaseResult } = this.state;
      const value = literalToReal(inputValue, increaseResult[1])
      const distributor = increaseResult[2];
      let that = this;
      let showApprove = await that.props.dispatch({
        type: 'mining/getShowApprove',
        payload: { lpToken: lpToken, distributor: distributor,value: value}
      })
      that.setState({
        showApprove: showApprove
      })
    }
  }

  handleOk = e => {
    this.setState({
      increaseVisible: false,
    });
  };

  handleCancel = e => {
    this.setState({
      increaseVisible: false,
    });
  };


  showExitModal = (index,item) => {
    let account = globals.loginAccount;
    let mining = this.props.mining;
    if(account){
      this.setState({
        power: mining.my[index].powerNormalizedLiteral,
        rewards: mining.my[index].unclaimedLiteral,
        exitVisible: true,
        selectedPoolItem: item
      })
    }else {
      alert('Please connect the wallet')
    }
  };

  handleExitOk = e => {
    this.setState({
      exitVisible: false,
    });
  };

  handleExitCancel = e => {
    this.setState({
      exitVisible: false,
    });
  };

  async checkNumber(type){
    let { selectedPoolItem, checkMax,increaseLimit } = this.state;
    checkMax = !checkMax
    this.setState({
      checkMax: checkMax
    });
    if(type ===0){//type=0 is increase,=1 is claim
      const form = this.refs.myForm;
      form.setFieldsValue({ increaseInput: increaseLimit});
      let { lpToken, increaseResult } = this.state;
      const distributor = increaseResult[2];
      let that = this;
      const value = literalToReal(increaseLimit, increaseResult[1])
      let showApprove = await that.props.dispatch({
        type: 'mining/getShowApprove',
        payload: { lpToken: lpToken, distributor: distributor,value: value}
      })
      that.setState({
        showApprove: showApprove
      })
    }else if(type ===1){
      let redeemInput = selectedPoolItem.rTokenBalanceLiteral
      const form = this.refs.myForm;
      form.setFieldsValue({ redeemInput : redeemInput})
    }
  }

  async claimFun(item){
    const account = globals.loginAccount
    if(account){
      const pid = item.id;
      let distributor;
      let that = this;
      globals.realDAO.distributor().then(function(rsp) {
        distributor = rsp;
        launchTransaction(distributor.claim(pid).send({ from: globals.loginAccount }))
      })
      that.getMining()
    }else {
      alert('Please connect the wallet')
    }

  }

  async exitFun(){
    const account = globals.loginAccount
    let item = this.state.selectedPoolItem
    if(account){
      const pid = item.id;
      let that = this;
      const distributor = await globals.realDAO.distributor()
      await launchTransaction(distributor.exit(pid).send({ from: globals.loginAccount }))
      that.setState({
        exitVisible: false,
      });
      that.getMining()
    }else {
      alert('Please connect the wallet')
    }

  }

  render() {
    const { app, mining, distributorStats, pageLoading } = this.props;
    const { theme,  } = app;
    let { countdown } = this.state;

    return (
      <Page
        // loading={loading.models.dashboard && sales.length === 0}
        className={theme === 'dark' ? styles.darkPage : styles.market}
      >
        {!pageLoading ?
          <div>
            <Card
              bordered={false}
              bodyStyle={{
                padding: '20px 0',
              }}>
              <Row lg={24}>
                <NumberCard title='Rewards Per Block' number={distributorStats.rewardsPerBlockLiteral} lg={8} unit='' theme={theme} effective={true} alignCenter={true} border={true}/>
                <NumberCard title='Mining Started Block' number={distributorStats.mineStartBlock} lg={8} unit='' theme={theme} effective={true} alignCenter={true} border={true}/>
                <NumberCard title='Next Halving Block' number={distributorStats.nextHalvingBlock} lg={8} unit='' theme={theme} effective={true} alignCenter={true} border={false}/>
              </Row>
            </Card>
            {mining.pools.map((item,index) =>
              <Card
                key={index}
                bordered={false}
                bodyStyle={{
                  padding: '20px 25px',
                }}>
                <div className={styles.miningTopArea}>
                  <div className={styles.miningName}>
                    {item.ptype === 1 ? <img src={lending}/> : <img src={exchange}/>}
                    <span>{item.title}</span>
                  </div>
                  {/*countdown*/}
                  {item.state ===1 ?
                    <div className={styles.statusArea}>
                      <span>Active</span>
                      <div className={styles.active}></div>
                    </div> : ''}
                  {item.state ===0 ?
                    <div className={styles.countdownArea}>
                      <ClockCircleOutlined />
                      {/*<span>Countdown: {countdown}</span>*/}
                      <Countdown countdown={item.countdown}/>
                    </div> : ''}
                  {item.state ===2 ?
                    <div className={styles.statusArea}>
                      <span>Closed</span>
                      <div className={styles.closed}></div>
                    </div> : ''}
                </div>
                <TableInfo total_power={item.totalPowerNormalizedLiteral.toFixed(4)} my_power={mining.my[index] ? mining.my[index].powerNormalizedLiteral.toFixed(4)+'('+(mining.my[index].powerRatio * 100).toFixed(2)+'%)' : '-'} start_block={item.startBlock} apy={(item.apy *100).toFixed(2)} claimed={mining.my[index] ? mining.my[index].claimedLiteral.toFixed(4) : '-'} unclaimed={mining.my[index] ? mining.my[index].unclaimedLiteral.toFixed(4) : '-'} theme={theme} />
                <div className={item.state ===1 || (item.state ===0 && item.countdown <=0) ? styles.btnList : styles.btnListDisabled}>
                  <p className={styles.btnItem} onClick={item.state ===1 || (item.state ===0 && item.countdown <=0) ? this.showModal.bind(this,item) : null}>IncreasePower</p>
                  <p className={styles.btnItem} onClick={item.state ===1 || (item.state ===0 && item.countdown <=0) ? this.claimFun.bind(this,item) : null}>Claim</p>
                  {item.ptype ===1 ? '' : <p className={styles.btnItem} onClick={item.state ===1 || (item.state ===0 && item.countdown <=0) ? this.showExitModal.bind(this,index,item) : null}>Exit</p>}
                </div>
              </Card>
            )}
            <Modal
              title=""
              visible={this.state.increaseVisible}
              okText='Confirm'
              onOk={this.handleOk}
              onCancel={this.handleCancel}
              footer={[
                <Button key="submit" type="primary"  onClick={this.handleOk}>
                  Confirm
                </Button>,
              ]}
              className={theme === 'dark' ? appStyles.modalDark : ''}
            >
              <div className={appStyles.dialogContent}>
                <div className={appStyles.title}>
                  <h3 className={appStyles.dialogTitle}>IncreasePower in Lending Pool</h3>
                </div>
                <p className={appStyles.increaseText}>You can increase your arithmetic power by supplying assets in RealDAO' market or by borrowing.</p>
              </div>
            </Modal>
            <Modal
              title=""
              visible={this.state.claimVisible}
              cancelText='Approve'
              okText='Lock'
              onOk={this.handleIncreaseOk}
              onCancel={this.handleIncreaseCancel}
              className={theme === 'dark' ? appStyles.modalDark : ''}
              footer={this.state.showApprove ?
                [
                  <Button key="approve" type="primary"  onClick={this.handleIncreaseApprove}>
                    Approve
                  </Button>,
                  <Button key="submit" type="primary"  onClick={this.handleIncreaseOk}>
                    Lock
                  </Button>
                ] :
                [
                  <Button key="submit" type="primary"  onClick={this.handleIncreaseOk}>
                    Lock
                  </Button>
                ]}
            >
              <div className={appStyles.dialogContent}>
                <div className={appStyles.title}>
                  <h3 className={appStyles.dialogTitle}>Increase Power</h3>
                  <p className={appStyles.titleDes}>by provide liquidity in uniswap</p>
                </div>
                <a href={this.state.selectedPoolItem.lpUrl} className={appStyles.linkArea}>
                  <h3>{this.state.selectedPoolItem.title} Uniswap V2 LP</h3>
                  <img src={theme === 'dark' ? linkWhite : linkBlack}/>
                </a>
                <div className={appStyles.inputArea}>
                  <div className={appStyles.inputDes}>
                    <p className={appStyles.des}>Total LP Token Balance<span>{this.state.increaseLimit}</span></p>
                  </div>
                  <div className={appStyles.inputContent}>
                    <Form
                      ref="myForm"
                      initialvalues={{
                        repayInput: 0
                      }}
                      onFinish={this.handleOk}
                    >
                      <FormItem name='increaseInput' rule={[
                        {required: true, message: 'Input increase amount'}
                      ]} onChange={this.handleIncreaseChange}
                      >
                        <Input placeholder='Input increase amount' type='text'/>
                      </FormItem>
                    </Form>
                    <Button className={[appStyles.maxBtn,this.state.checkMax ? appStyles.checkedNumberBtn : '']} onClick={this.checkNumber.bind(this,0)}>MAX</Button>
                  </div>
                </div>
              </div>
            </Modal>
            <Modal
              title=""
              visible={this.state.exitVisible}
              okText='Confirm'
              onOk={this.handleExitOk}
              onCancel={this.handleExitCancel}
              footer={[
                <Button key="submit" type="primary"  onClick={this.exitFun}>
                  Confirm
                </Button>,
              ]}
              className={theme === 'dark' ? appStyles.modalDark : ''}
            >
              <div className={appStyles.dialogContent}>
                <div className={appStyles.title}>
                  <h3 className={appStyles.dialogTitle}>Exit LP Pool</h3>
                </div>
                <div className={appStyles.exitInfo}>
                  <div className={appStyles.infoItem}>
                    <p className={appStyles.infoTitle}>LP Token</p>
                    <p className={appStyles.infoValue}>{Number(this.state.power).toFixed(4)}</p>
                  </div>
                  <div className={appStyles.infoItem}>
                    <p className={appStyles.infoTitle}>Rewards</p>
                    <p className={appStyles.infoValue}>{Number(this.state.rewards).toFixed(4)}</p>
                  </div>
                </div>
              </div>
            </Modal>
          </div>
          :
          <div className={appStyles.loading}>
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
    mining: state.mining.mining,
    distributorStats: state.mining.distributorStats,
    pageLoading: state.mining.pageLoading
  };
}

export default connect(mapStateToProps)(Mining);
