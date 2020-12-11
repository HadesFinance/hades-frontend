import React, {PureComponent} from 'react'
import { connect, withRouter } from 'umi';
import { Row,  Card, Button, Input, Modal, Form } from 'antd';
import {
  ClockCircleOutlined
} from '@ant-design/icons'
import { Page, } from 'components'
import styles from './index.less'
import { NumberCard } from '../dashboard/components';
import exchange from '../../../public/exchanging.svg';
import lending from '../../../public/lending.svg'
import linkBlack from '../../../public/link_black.svg'
import linkWhite from '../../../public/link_white.svg'
import { TableInfo } from './components/'
import { globals } from '../../utils/constant';
import { HADES_CONFIG } from '../../../config';
import Hades from '../../utils/hades';
import store from 'store';
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
    lockEnable:false
  };

  componentDidMount() {
    let that = this
    that.getMining();
    that.refreshId = setInterval(function() {
      console.log('refresh mining')
      that.getMining()
    },15000)
  }

  componentWillUnmount() {
    clearInterval(this.refreshId)
  }

  getMining(){
    let that = this;
    that.props.dispatch({
      type: 'mining/queryMining'
    }).then(function(rsp) {
      console.log(rsp)
      let countdownList = rsp.pools.filter(item => item.state ==='0');
      if(countdownList.length >0){
        let countdownValue = countdownList[0].countdown;
        console.log('countdown='+countdownValue)
        that.intervalId = setInterval(function () {
          countdownValue = countdownValue >0 ? countdownValue -1 : 0
          that.setState({
            countdown: countdownValue
          })
        }.bind(this), 1000)
      }
    });
    that.props.dispatch({
      type: 'mining/queryDistributorStats'
    })
  }

  componentWillUnmount() {
    clearInterval(this.intervalId)
  }

  showModal = async (item) => {
    let account = (globals.loginAccount = window.ethereum.selectedAddress);
    console.log('ptype='+item.ptype);
    if(item.ptype ==='1' && account){
      this.setState({
        increaseVisible: true,
      });
    }else if(item.ptype ==='2' && account){
      const network = store.get('network');
      let hades = (globals.hades = new Hades(network))
      await hades.setProvider(window.web3.currentProvider);
      const pid = item.id;
      const lpTokenAddr = await globals.lpTokenMap.get(pid)
      if (!lpTokenAddr) {
        return alert('failed to get lp token address')
      }
      this.setState({
        claimVisible: true,
        selectedPoolItem: item
      });
      let that = this;
      const lpToken = await globals.hades.lpToken(lpTokenAddr);
      const results = await Promise.all([
        lpToken.balanceOf(account).call(),
        lpToken.decimals().call(),
        globals.hades.distributor(),
      ])
      console.log(results);
      const balance = results[0]
      const decimals = results[1]
      const balanceLiteral = await that.realToLiteral(balance, decimals)
      that.setState({
        increaseLimit: balanceLiteral,
        increaseResult: results,
        lpToken: lpToken
      })
    }else if(!account){
      alert('Please connect the wallet')
    }
  };


  realToLiteral(real, decimals) {
    const literal = Number(real) / 10 ** Number(decimals)
    return literal
  }


  literalToReal(literal, decimals) {
    const real = Number(literal) * 10 ** Number(decimals)
    return real.toString()
  }

  async launchTransaction(transaction) {
    try {
      const result = await transaction
      if (result.transactionHash) {
        globals.pendingTransactions.push(result.transactionHash)
      }
      this.getMining()
    } catch (e) {
      console.log('failed to launch transaction:', e);
      alert('failed to launch transaction:'+e)
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


  handleIncreaseOk = async (e) => {
    let { increaseResult, lpToken, selectedPoolItem,lockEnable } = this.state;
    if(lockEnable){
      let results = increaseResult;
      let account = globals.loginAccount;
      let pid = selectedPoolItem.id;
      const form = this.refs.myForm;
      const values = form.getFieldsValue(['increaseInput'])
      let inputAmount = values.increaseInput;
      const balance = results[0]
      const decimals = results[1]
      if(inputAmount !==undefined){
        const realAmount = await this.literalToReal(inputAmount, decimals)
        const distributor = results[2]

        await this.launchTransaction(distributor.mintExchangingPool(pid, realAmount).send({ from: account }))
        this.setState({
          claimVisible: false,
          checkMax: false,
          lockEnable: false
        })
        this.getMining()
      }
    }else {
      alert('please approve first')
    }
  };

  handleIncreaseApprove = async (e) => {
    let { increaseResult, lpToken, selectedPoolItem } = this.state;
    let results = increaseResult;
    let account = globals.loginAccount;
    let pid = selectedPoolItem.id;
    const form = this.refs.myForm;
    const values = form.getFieldsValue(['increaseInput'])
    let inputAmount = values.increaseInput;
    const balance = results[0]
    const decimals = results[1]
    if(inputAmount !==undefined){
      const realAmount = await this.literalToReal(inputAmount, decimals)
      const distributor = results[2]
      await lpToken.approve(distributor._address, realAmount).send({ from: account });
      this.setState({
        lockEnable: true
      })
    }
  };

  handleIncreaseCancel = (e) => {
    this.setState({
      claimVisible: false,
      checkMax: false,
    })
  }

  showExitModal = (index) => {
    let account = globals.loginAccount;
    let mining = this.props.mining;
    if(account){
      this.setState({
        power: mining.my[index].powerNormalizedLiteral,
        rewards: mining.my[index].unclaimedLiteral,
        exitVisible: true,
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

  checkNumber(type){
    let { selectedPoolItem, checkMax,increaseLimit } = this.state;
    checkMax = !checkMax
    this.setState({
      checkMax: checkMax
    });
    if(type ===0){//type=0 is increase,=1 is claim
      const form = this.refs.myForm;
      form.setFieldsValue({ increaseInput: increaseLimit})
    }else if(type ===1){
      let redeemInput = selectedPoolItem.hTokenBalanceLiteral
      const form = this.refs.myForm;
      form.setFieldsValue({ redeemInput : redeemInput})
    }
  }

  async claimFun(item){
    const account = globals.loginAccount
    if(account){
      const network = store.get('network');
      let hades = (globals.hades = new Hades(network))
      await hades.setProvider(window.web3.currentProvider);
      const pid = item.id;
      let distributor;
      let that = this;
      globals.hades.distributor().then(function(rsp) {
        distributor = rsp;
        that.launchTransaction(distributor.claim(pid).send({ from: globals.loginAccount }))
      })
      that.getMining()
    }else {
      alert('Please connect the wallet')
    }

  }

  render() {
    const { app, mining, distributorStats,  } = this.props;
    const { theme,  } = app;
    let { countdown } = this.state;

    return (
      <Page
        // loading={loading.models.dashboard && sales.length === 0}
        className={theme === 'dark' ? styles.darkPage : styles.market}
      >
        <Card
          bordered={false}
          bodyStyle={{
            padding: '20px 25px',
          }}>
          <Row lg={24}>
            <NumberCard title='Rewards Per Block' number={distributorStats.rewardsPerBlockLiteral} lg={8} unit='' theme={theme} effective={true}/>
            <NumberCard title='Mining Started Block' number={distributorStats.mineStartBlock} lg={8} unit='' theme={theme} effective={true}/>
            <NumberCard title='Next Halving Block' number={distributorStats.nextHalvingBlock} lg={8} unit='' theme={theme} effective={true}/>
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
                {item.ptype === '1' ? <img src={lending}/> : <img src={exchange}/>}
                <span>{item.title}</span>
              </div>
              {/*countdown*/}
              {item.state ==='1' ?
                <div className={styles.statusArea}>
                <span>Active</span>
                <div className={styles.active}></div>
              </div> : ''}
              {item.state ==='0' ?
                <div className={styles.countdownArea}>
                  <ClockCircleOutlined />
                  <span>Countdown: {countdown}</span>
                </div> : ''}
              {item.state ==='2' ?
                <div className={styles.statusArea}>
                  <span>Closed</span>
                  <div className={styles.closed}></div>
                </div> : ''}
            </div>
            <TableInfo total_power={item.totalPowerNormalizedLiteral.toFixed(4)} my_power={mining.my[index] ? mining.my[index].powerNormalizedLiteral.toFixed(4)+'('+(mining.my[index].powerRatio * 100).toFixed(2)+'%)' : '-'} start_block={item.startBlock} apy={(item.apy *100).toFixed(2)} claimed={mining.my[index] ? mining.my[index].claimedLiteral.toFixed(4) : '-'} unclaimed={mining.my[index] ? mining.my[index].unclaimedLiteral.toFixed(4) : '-'} theme={theme} />
            <div className={item.state ==='1' || (item.state ==='0' && item.countdown <=0) ? styles.btnList : styles.btnListDisabled}>
              <p className={styles.btnItem} onClick={item.state ==='1' || (item.state ==='0' && item.countdown <=0) ? this.showModal.bind(this,item) : null}>IncreasePower</p>
              <p className={styles.btnItem} onClick={item.state ==='1' || (item.state ==='0' && item.countdown <=0) ? this.claimFun.bind(this,item) : null}>Claim</p>
              {item.ptype ==='1' ? '' : <p className={styles.btnItem} onClick={item.state ==='1' || (item.state ==='0' && item.countdown <=0) ? this.showExitModal.bind(this,index) : null}>Exit</p>}
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
          className={theme === 'dark' ? styles.modalDark : ''}
        >
          <div className={styles.dialogContent}>
            <div className={styles.title}>
              <h3 className={styles.dialogTitle}>IncreasePower in Lending Pool</h3>
            </div>
            <p className={styles.increaseText}>You can increase your arithmetic power by supplying assets in Hades' market or by borrowing.</p>
          </div>
        </Modal>
        <Modal
          title=""
          visible={this.state.claimVisible}
          cancelText='Approve'
          okText='Lock'
          onOk={this.handleIncreaseOk}
          onCancel={this.handleIncreaseCancel}
          className={theme === 'dark' ? styles.modalDark : ''}
          footer={[
            <Button key="approve" type="primary"  onClick={this.handleIncreaseApprove}>
              Approve
            </Button>,
            <Button key="submit" type="primary"  onClick={this.handleIncreaseOk}>
              Lock
            </Button>
          ]}
        >
          <div className={styles.dialogContent}>
            <div className={styles.title}>
              <h3 className={styles.dialogTitle}>Increase Power</h3>
              <p className={styles.titleDes}>by provide liquidity in uniswap</p>
            </div>
            <a href={this.state.selectedPoolItem.lpUrl} className={styles.linkArea}>
              <h3>{this.state.selectedPoolItem.title} Uniswap V2 LP</h3>
              <img src={theme === 'dark' ? linkWhite : linkBlack}/>
            </a>
            <div className={styles.inputArea}>
              <div className={styles.inputDes}>
                <p className={styles.des}>Total LP Token Balance: {this.state.increaseLimit}</p>
              </div>
              <div className={styles.inputContent}>
                <Form
                  ref="myForm"
                  initialvalues={{
                    repayInput: 0
                  }}
                  onFinish={this.handleOk}
                >
                  <FormItem name='increaseInput' rule={[
                    {required: true, message: 'Input increase amount'}
                  ]}>
                    <Input placeholder='Input increase amount' type='number'/>
                  </FormItem>
                </Form>
                <Button className={[styles.maxBtn,this.state.checkMax ? styles.checkedNumberBtn : '']} onClick={this.checkNumber.bind(this,0)}>MAX</Button>
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
            <Button key="submit" type="primary"  onClick={this.handleExitOk}>
              Confirm
            </Button>,
          ]}
          className={theme === 'dark' ? styles.modalDark : ''}
        >
          <div className={styles.dialogContent}>
            <div className={styles.title}>
              <h3 className={styles.dialogTitle}>Exit LP Pool</h3>
            </div>
            <div className={styles.exitInfo}>
              <div className={styles.infoItem}>
                <p className={styles.infoTitle}>LP Token</p>
                <p className={styles.infoValue}>{Number(this.state.power).toFixed(4)}</p>
              </div>
              <div className={styles.infoItem}>
                <p className={styles.infoTitle}>Rewards</p>
                <p className={styles.infoValue}>{Number(this.state.rewards).toFixed(4)}</p>
              </div>
            </div>
          </div>
        </Modal>
      </Page>
    )
  }
}



function mapStateToProps(state) {
  console.log(state);
  return {
    mining: state.mining.mining,
    distributorStats: state.mining.distributorStats
  };
}

export default connect(mapStateToProps)(Mining);
