import React, { PureComponent } from 'react'
import { connect, withRouter } from 'umi';
import { Card, Table, Modal, Button, Input, Form } from 'antd';
import { Page, } from 'components'
import { NumberCard } from '../dashboard/components';
import styles from './index.less'
import wallet from '../../../public/wallet.svg'
import DOL from '../../../public/DOL.svg'
import ETH from '../../../public/ethereum_L.svg'
import { globals } from '../../utils/constant';
import Hades from '../../utils/hades';
import store from 'store';
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
    repayResults:[]
  };

  componentDidMount() {
    let that = this;
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', function() {
        that.props.dispatch({
          type: 'account/login'
        });
      })
    }
    let loginAccount = globals.loginAccount;
    if(loginAccount){
      that.props.dispatch({
        type: 'account/login'
      });
    }
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

  showModal = (item,e) => {
    console.log(item)
    this.setState({
      repayVisible: true,
      selectedPoolItem: item
    });
  };

  handleOk = async (e) => {
    const account = globals.loginAccount;
    let { selectedPoolItem } = this.state;
    const form = this.refs.myForm;
    const values = form.getFieldsValue(['repayInput'])
    let inputAmount = values.repayInput;
    if(account){
      const network = store.get('network');
      let hades = (globals.hades = new Hades(network))
      await hades.setProvider(window.web3.currentProvider);
      let symbol = selectedPoolItem.underlyingSymbol;
      console.log(symbol);
      const address = await globals.hTokenMap.get(symbol);
      console.log(address)
      if (!symbol || !address) {
        alert('Please get symbol and hToken first!')
        throw new Error('Failed to get hToken address')
      }
      let that = this;
      const results = await Promise.all([
        globals.hades.getHTokenBalances(address, account),
        globals.hades.hToken(symbol, address),
        globals.hades.dol(),
      ]);
      const balanceInfo = results[0]
      const hToken = results[1]
      const dol = results[2]
      if(inputAmount !==undefined){
        const realAmount = await that.literalToReal(inputAmount, balanceInfo.underlyingDecimals)
        if (symbol === 'ETH') {
          await that.launchTransaction(hToken.repayBorrow().send({ from: account, value: realAmount }))
          that.setState({
            repayVisible: false,
            checkMax: false,
            repayEnable: false
          })
          that.props.dispatch({
            type: 'account/login'
          });
        } else {
          await dol.approve(address, realAmount).send({ from: account });
          that.setState({
            repayEnable:true,
            repayResults: results
          })
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
      const realAmount = await that.literalToReal(inputAmount, balanceInfo.underlyingDecimals)
      await that.launchTransaction(hToken.repayBorrow(realAmount).send({ from: account }))
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
    } catch (e) {
      console.log('failed to launch transaction:', e);
      alert('failed to launch transaction:'+e)
    }
  }

  handleCancel = e => {
    this.setState({
      repayVisible: false,
      checkMax: false,
      repayEnable: false
    });
  };

  showRedeemModal = (item,e) => {
    this.setState({
      redeemVisible: true,
      selectedPoolItem: item
    });
  };

  handleRedeemOk = async (e) => {
    const account = globals.loginAccount;
    let { selectedPoolItem } = this.state;
    const form = this.refs.myForm;
    const values = form.getFieldsValue(['redeemInput'])
    let inputAmount = values.redeemInput;
    if(account){
      const network = store.get('network');
      let hades = (globals.hades = new Hades(network))
      await hades.setProvider(window.web3.currentProvider);
      let symbol = selectedPoolItem.underlyingSymbol;
      console.log(symbol);
      const address = await globals.hTokenMap.get(symbol);
      console.log(address)
      if (!symbol || !address) {
        alert('Please get symbol and hToken first!')
        throw new Error('Failed to get hToken address')
      }
      let that = this;
      const results = await Promise.all([
        globals.hades.getHTokenBalances(address, account),
        globals.hades.hToken(symbol, address),
      ]);
      const balanceInfo = results[0]
      const hToken = results[1]
      if(inputAmount !==undefined){
        const realAmount = await that.literalToReal(inputAmount, 8)
        await that.launchTransaction(hToken.redeem(realAmount).send({ from: account }))
        that.setState({
          redeemVisible: false,
          checkMax: false
        })
        that.props.dispatch({
          type: 'account/login'
        });
      }
    }else {
      alert('Please connect the wallet')
    }
  };

  handleRedeemCancel = e => {
    this.setState({
      redeemVisible: false,
      checkMax: false
    });
  };

  checkNumber(type){
    let { selectedPoolItem, checkMax } = this.state;
    checkMax = !checkMax
    this.setState({
      checkMax: checkMax
    });
    if(type ===0){//type=0 is repay,=1 is redeem
      let repayInput = selectedPoolItem.borrowBalanceLiteral
      const form = this.refs.myForm;
      form.setFieldsValue({ repayInput : repayInput})
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
    const { app, connected,account } = this.props
    const { theme,  } = app
    const { selectedPoolItem } = this.state;
    return (
      <Page
        // loading={loading.models.dashboard && sales.length === 0}
        className={theme === 'dark' ? styles.darkPage : styles.account}
      >
        {connected ?
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
            footer={selectedPoolItem.underlyingSymbol !=='ETH' ?
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
                    ]}>
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
                  <p className={styles.des}>Allowed Amount:{selectedPoolItem.hTokenBalanceLiteral.toFixed(4)}</p>
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
  console.log(state);
  return {
    connected: state.account.connected,
    wrongNetwork: state.account.wrongNetwork,
    loginAccount: state.account.loginAccount,
    account: state.account.account
  };
}

export default connect(mapStateToProps)(Account);
