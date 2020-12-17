import React, { PureComponent } from 'react'
import { connect, withRouter } from 'umi';
import { Card, Table, Modal, Button, Input, Form } from 'antd';
import { Page, } from 'components'
import { NumberCard } from '../dashboard/components';
import styles from './index.less'
import wallet from '../../../public/wallet.svg'
import DOL from '../../../public/DOL.svg'
import ETH from '../../../public/ethereum_L.svg'
import { globals, MAX_UINT256, literalToReal, launchTransaction, init} from '../../utils/constant';
import Hades from '../../utils/hades';
import store from 'store';
import { LoadingOutlined } from '@ant-design/icons';
const FormItem = Form.Item;



@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class Account extends PureComponent {

  state = {
    repayVisible: false,
    redeemVisible: false,
    selectedPoolItem:{},
    checkMax: false,
    repayEnable: false,
    repayResults:[],
    redeemResults:[],
    showApprove: false,
    address:'',
  };

  componentDidMount() {
    let that = this;
    let loginAccount = globals.loginAccount;
    if(loginAccount){
      that.props.dispatch({
        type: 'account/login'
      });
    }
    that.refreshAccount = setInterval(function() {
      if(loginAccount){
        that.props.dispatch({
          type: 'account/login'
        });
      }
    },15000)
  }

  componentWillUnmount() {
    clearInterval(this.refreshAccount)
  }

  connectWallet(){
    if (window.ethereum) {
      window.ethereum.enable()
      this.login()
    } else {
      alert('Please install MetaMask to use this dApp!')
    }
  }

  login = () => {
    this.props.dispatch({
      type: 'account/login'
    });
  }

  showModal = async (item,e) => {
    let account = globals.loginAccount;
    await init();
    let symbol = item.underlyingSymbol;
    const address = globals.hTokenMap.get(symbol);
    if (!symbol || !address) {
      alert('Please get symbol and hToken first!')
      throw new Error('Failed to get hToken address')
    }
    this.setState({
      repayVisible: true,
      selectedPoolItem: item
    });
    const dol = await globals.hades.dol()
    const allowance = await dol.allowance(account, address).call();
    const showApprove = allowance.toString() ==='0' || BigInt(allowance.toString()) < BigInt(0);
    this.setState({
      showApprove: showApprove
    })
    const results = await Promise.all([
      globals.hades.getHTokenBalances(address, account),
      globals.hades.hToken(symbol, address),
      globals.hades.dol(),
    ]);
    this.setState({
      repayResults: results,
      address: address
    })
  };

  handleOk = async (e) => {
    const account = globals.loginAccount;
    let { selectedPoolItem,repayResults,address } = this.state;
    let results = repayResults;
    const form = this.refs.myForm;
    const values = form.getFieldsValue(['repayInput'])
    let inputAmount = values.repayInput;
    if(account){
      const balanceInfo = results[0]
      const hToken = results[1]
      const dol = results[2]
      let that = this;
      if(inputAmount !==undefined){
        const realAmount = await literalToReal(inputAmount, balanceInfo.underlyingDecimals)
        if (selectedPoolItem.underlyingSymbol === 'ETH') {
          await launchTransaction(hToken.repayBorrow().send({ from: account, value: realAmount }))
          that.setState({
            repayVisible: false,
            checkMax: false,
            repayEnable: false
          })
          that.props.dispatch({
            type: 'account/login'
          });
        } else {
          if(this.state.showApprove){
            await dol.approve(address, MAX_UINT256).send({ from: account });
            that.setState({
              repayEnable:true
            })
          }else {
            that.setState({
              repayEnable:true,
            },function() {
              that.handleRepayDol()
            })
          }
        }
      }
    }else {
      alert('Please connect the wallet')
    }
  };

  handleRepayDol = async (e) => {
    const account = globals.loginAccount;
    let { selectedPoolItem, repayResults,repayEnable } = this.state;
    if(repayEnable){
      let results = repayResults;
      const form = this.refs.myForm;
      const values = form.getFieldsValue(['repayInput'])
      let inputAmount = values.repayInput;
      let that = this;
      const balanceInfo = results[0]
      const hToken = results[1]
      const realAmount = await literalToReal(inputAmount, balanceInfo.underlyingDecimals)
      await launchTransaction(hToken.repayBorrow(realAmount).send({ from: account }))
      that.setState({
        repayVisible: false,
        checkMax: false,
        repayEnable: false
      })
      that.props.dispatch({
        type: 'account/login'
      });
    }else {
      alert('please approve first')
    }
  };

  handleCancel = e => {
    this.setState({
      repayVisible: false,
      checkMax: false,
      repayEnable: false
    });
  };

  handleRepayChange = async (e) => {
    let inputValue = e.target.value;
    if(inputValue !==null){
      let { address, repayResults } = this.state;
      const balanceInfo = repayResults[0]
      const account = globals.loginAccount
      const dol = await globals.hades.dol()
      const allowance = await dol.allowance(account, address).call();
      let that = this
      const value = literalToReal(inputValue, balanceInfo.underlyingDecimals)
      const showApprove = BigInt(allowance.toString()) < BigInt(value);
      that.setState({
        showApprove: showApprove
      })
    }
  }

  showRedeemModal = async (item,e) => {
    const account = globals.loginAccount;
    if(account){
      await init()
      let symbol = item.underlyingSymbol;
      const address = await globals.hTokenMap.get(symbol);
      if (!symbol || !address) {
        alert('Please get symbol and hToken first!')
        throw new Error('Failed to get hToken address')
      }
      let that = this;
      const results = await Promise.all([
        globals.hades.getHTokenBalances(address, account),
        globals.hades.hToken(symbol, address),
      ]);
      that.setState({
        redeemVisible: true,
        selectedPoolItem: item,
        redeemResults: results
      });
    }else {
      alert('Please connect the wallet')
    }
  };

  handleRedeemOk = async (e) => {
    const account = globals.loginAccount;
    let { selectedPoolItem,redeemResults } = this.state;
    let results = redeemResults;
    const form = this.refs.myForm;
    const values = form.getFieldsValue(['redeemInput'])
    let inputAmount = values.redeemInput;
    const balanceInfo = results[0]
    const hToken = results[1]
    let that = this;
    if(inputAmount !==undefined){
      const realAmount = await literalToReal(inputAmount, 8)
      await launchTransaction(hToken.redeem(realAmount).send({ from: account }))
      that.setState({
        redeemVisible: false,
        checkMax: false
      })
      that.props.dispatch({
        type: 'account/login'
      });
    }
  };

  handleRedeemCancel = e => {
    this.setState({
      redeemVisible: false,
      checkMax: false
    });
  };

  async checkNumber(type){
    let { selectedPoolItem, checkMax } = this.state;
    checkMax = !checkMax
    this.setState({
      checkMax: checkMax
    });
    if(type ===0){//type=0 is repay,=1 is redeem
      let repayInput = selectedPoolItem.borrowBalanceLiteral
      const form = this.refs.myForm;
      form.setFieldsValue({ repayInput : repayInput});
      let { address,repayResults} = this.state;
      const account = globals.loginAccount
      const dol = await globals.hades.dol()
      const allowance = await dol.allowance(account, address).call();
      let that = this
      const value = literalToReal(repayInput, repayResults[0].underlyingDecimals)
      const showApprove = allowance.toString() ==='0' || BigInt(allowance.toString()) < BigInt(value);
      that.setState({
        showApprove: showApprove
      })
    }else if(type ===1){
      let redeemInput = selectedPoolItem.hTokenBalanceLiteral
      const form = this.refs.myForm;
      form.setFieldsValue({ redeemInput : redeemInput})
    }
  }


  columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (_, { underlyingSymbol}) => {
        let icon = underlyingSymbol ==='ETH' ? ETH : DOL;
        return (
          <div className={styles.nameArea}>
            <img src={icon}/>
            <span>{underlyingSymbol}</span>
          </div>
        );
      },
    },
    {
      title: 'Balance',
      dataIndex: 'tokenBalanceLiteral',
      render: (_, { tokenBalanceLiteral}) => {
        return (
          <div className={styles.nameArea}>
            <span>{tokenBalanceLiteral.toFixed(4)}</span>
          </div>
        );
      },
    },
    {
      title: 'Collateral',
      dataIndex: 'collateralBalanceLiteral',
      render: (_, { collateralBalanceLiteral}) => {
        return (
          <div className={styles.nameArea}>
            <span>{collateralBalanceLiteral.toFixed(4)}</span>
          </div>
        );
      },
    },{
      title: 'Debts',
      dataIndex: 'borrowBalanceLiteral',
      render: (_, { borrowBalanceLiteral}) => {
        return (
          <div className={styles.nameArea}>
            <span>{borrowBalanceLiteral.toFixed(4)}</span>
          </div>
        );
      },
    },
    {
      title: 'Options',
      dataIndex: 'operation',
      render: (_,{underlyingSymbol,tokenBalanceLiteral,collateralBalanceLiteral,borrowBalanceLiteral,hTokenBalanceLiteral}) => {
        let item = {
          underlyingSymbol: underlyingSymbol,
          tokenBalanceLiteral:tokenBalanceLiteral,
          collateralBalanceLiteral:collateralBalanceLiteral,
          borrowBalanceLiteral: borrowBalanceLiteral,
          hTokenBalanceLiteral: hTokenBalanceLiteral
        }
        return (
          <div className={styles.btnList}>
            <p className={styles.btnItem} onClick={this.showModal.bind(this,item)}>Repay</p>
            <p className={styles.btnItem} onClick={this.showRedeemModal.bind(this,item)}>Redeem</p>
          </div>
        );
      },
    },
  ];


  render() {
    const { app, connected,account, pageLoading } = this.props
    const { theme,  } = app
    const { selectedPoolItem } = this.state;
    return (
      <Page
        // loading={loading.models.dashboard && sales.length === 0}
        className={theme === 'dark' ? styles.darkPage : styles.account}
      >
        {connected ?
          <div>
            {!pageLoading ?
              <div>
                <Card
                  bordered={false}
                  bodyStyle={{
                    padding: '30px 25px',
                  }}>
                  <NumberCard title='Balance' number={account.hds.balanceLiteral} lg={24} unit='HDS' position='right'  big={true} decimals={4} theme={theme}/>
                </Card>
                <Card
                  bordered={false}
                  bodyStyle={{
                    padding: '0 25px',
                  }}>
                  <Table columns={this.columns} dataSource={account.sheets}  rowKey="underlyingSymbol" pagination={false} />
                </Card>
              </div> :
              <div className={styles.loading}>
                <div>
                  <LoadingOutlined/>
                  <span>loading</span>
                </div>
              </div>
            }
          </div>
          :
          <div className={styles.notConnected}>
            <img src={wallet}/>
            <p className={styles.notConnectedTip}>Please connect to the wallet</p>
            <p className={styles.connectedBtn} onClick={this.connectWallet.bind(this)}>Connect with Metamask</p>
          </div>
          }
        {this.state.repayVisible ?
          <Modal
            title=""
            visible={this.state.repayVisible}
            cancelText='Approve'
            okText='Repay'
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            className={theme === 'dark' ? styles.modalDark : ''}
            footer={selectedPoolItem.underlyingSymbol !=='ETH' && this.state.showApprove ?
              [
                <Button key="approve" type="primary"  onClick={this.handleOk}>
                  Approve
                </Button>,
                <Button key="repay" type="primary"  onClick={this.handleRepayDol}>
                  Repay
                </Button>
              ] :
              [
                <Button key="submit" type="primary"  onClick={this.handleOk}>
                  Repay
                </Button>
              ]
            }
          >
            <div className={styles.dialogContent}>
              <div className={styles.title}>
                <h3 className={styles.dialogTitle}>Repay {selectedPoolItem.underlyingSymbol}</h3>
                <p className={styles.titleDes}>Total Debts:{selectedPoolItem.borrowBalanceLiteral.toFixed(4)}</p>
              </div>
              <div className={styles.inputArea}>
                <div className={styles.inputDes}>
                  <p className={styles.des}>Total Balance：{selectedPoolItem.tokenBalanceLiteral.toFixed(4)}</p>
                </div>
                <div className={styles.inputContent}>
                  <Form
                    ref="myForm"
                    initialvalues={{
                      repayInput: 0
                    }}
                    onFinish={this.handleOk}
                  >
                    <FormItem name='repayInput' rule={[
                      {required: true, message: 'Input repay amount'}
                    ]} onChange={this.handleRepayChange}>
                      <Input placeholder='Input repay amount' type='number'/>
                    </FormItem>
                  </Form>
                  <Button className={[styles.maxBtn,this.state.checkMax ? styles.checkedNumberBtn : '']} onClick={this.checkNumber.bind(this,0)}>MAX</Button>
                </div>
              </div>
            </div>
          </Modal> : ''}
        {this.state.redeemVisible ?
          <Modal
            title=""
            visible={this.state.redeemVisible}
            okText='Redeem'
            onOk={this.handleRedeemOk}
            onCancel={this.handleRedeemCancel}
            className={theme === 'dark' ? styles.modalDark : ''}
            footer={[
              <Button key="submit" type="primary"  onClick={this.handleRedeemOk}>
                Redeem
              </Button>,
            ]}
          >
            <div className={styles.dialogContent}>
              <div className={styles.title}>
                <h3 className={styles.dialogTitle}>Redeem {selectedPoolItem.underlyingSymbol}</h3>
              </div>
              <div className={styles.inputArea}>
                <div className={styles.inputDes}>
                  <p className={styles.des}>Allowed Amount:{this.state.redeemResults[0].hTokenBalanceLiteral.toFixed(4)}</p>
                  {/*<p className={styles.des}>Exchange Rate:1.1</p>*/}
                </div>
                <div className={styles.inputContent}>
                  <Form
                    ref="myForm"
                    initialvalues={{
                      redeemInput: 0
                    }}
                    onFinish={this.handleRedeemOk}
                  >
                    <FormItem name='redeemInput' rule={[
                      {required: true, message: 'Input redeem amount'}
                    ]}>
                      <Input placeholder='Input redeem amount' type='number'/>
                    </FormItem>
                  </Form>
                  <Button className={[styles.maxBtn,this.state.checkMax ? styles.checkedNumberBtn : '']} onClick={this.checkNumber.bind(this,1)}>MAX</Button>
                </div>
              </div>
            </div>
          </Modal> : ''}
      </Page>
    )
  }
}



function mapStateToProps(state) {
  return {
    connected: state.account.connected,
    wrongNetwork: state.account.wrongNetwork,
    loginAccount: state.account.loginAccount,
    account: state.account.account,
    pageLoading: state.account.pageLoading
  };
}

export default connect(mapStateToProps)(Account);
