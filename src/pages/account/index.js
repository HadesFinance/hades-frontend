import React, { PureComponent } from 'react'
import { connect, withRouter } from 'umi';
import { Card, Table, Modal, Button, Input, Form } from 'antd';
import { Page, } from 'components'
import { NumberCard } from '../dashboard/components';
import styles from './index.less'
import appStyles from '../app.less'
import wallet from '../../../public/wallet.svg'
import metaMask from '../../../public/MetaMask.svg'
import DOL from '../../../public/dol.svg'
import ETH from '../../../public/ETH.svg'
import dol from '../../../public/dol.svg'
import hbtc from '../../../public/hbtc.svg';
import heth from '../../../public/heth.svg'
import wht from '../../../public/wht.svg'
import { globals, literalToReal,} from '../../utils/constant';
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
    iconList:[dol,hbtc,heth,wht]
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
      if (globals.realDAO) globals.realDAO.setProvider(window.web3.currentProvider)
      globals.realDAO.loadRTokens()
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
    let symbol = item.underlyingSymbol;
    const address = await this.props.dispatch({type: 'market/queryAddress', payload: {symbol: symbol}});
    this.setState({
      repayVisible: true,
      selectedPoolItem: item
    });
    const showApprove = await this.props.dispatch({ type: 'market/getShowApprove', payload: { address:address,account: account,value:0}})
    let that = this;
    await that.props.dispatch({
      type:'account/queryRepayResults',
      payload:{ symbol: symbol,address: address}
    }).then((res) =>{
      that.setState({
        repayResults: res,
        address: address,
        showApprove: showApprove
      })
    })
  };

  handleOk = async (e) => {
    const account = globals.loginAccount;
    let { selectedPoolItem,repayResults,address, showApprove } = this.state;
    const form = this.refs.myForm;
    const values = form.getFieldsValue(['repayInput'])
    let inputAmount = values.repayInput;
    if(account){
      let that = this;
      if(inputAmount !==undefined){
        that.props.dispatch({
          type:'account/submitRepay',
          payload: { inputAmount: inputAmount,results: repayResults,symbol:selectedPoolItem.underlyingSymbol,address: address,showApprove: showApprove}
        }).then(() =>{
          if (selectedPoolItem.underlyingSymbol === 'ETH') {
            that.setState({
              repayVisible: false,
              checkMax: false,
              repayEnable: false
            })
          } else {
            if(showApprove){
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
        })
      }
    }else {
      alert('Please connect the wallet')
    }
  };

  handleRepayDol = async (e) => {
    let { repayResults,repayEnable } = this.state;
    if(repayEnable){
      const form = this.refs.myForm;
      const values = form.getFieldsValue(['repayInput'])
      let inputAmount = values.repayInput;
      let that = this;
      that.props.dispatch({
        type: 'account/repayDol',
        payload:{ inputAmount: inputAmount, results: repayResults}
      }).then(() =>{
        that.setState({
          repayVisible: false,
          checkMax: false,
          repayEnable: false
        })
      })
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
      let that = this
      const value = literalToReal(inputValue, balanceInfo.underlyingDecimals);
      const showApprove = await that.props.dispatch({ type: 'market/getShowApprove', payload: { address:address,account: globals.loginAccount,value:value}})
      that.setState({
        showApprove: showApprove
      })
    }
  }

  showRedeemModal = async (item,e) => {
    const account = globals.loginAccount;
    let symbol = item.underlyingSymbol;
    const address = await this.props.dispatch({type:'market/queryAddress', payload: {symbol: symbol}});
    if(account){
      let that = this;
      await that.props.dispatch({
        type: 'account/queryRedeemResults',
        payload: { address: address, symbol: symbol}
      }).then((res) =>{
        that.setState({
          redeemVisible: true,
          selectedPoolItem: item,
          redeemResults: res
        });
      })
    }else {
      alert('Please connect the wallet')
    }
  };

  handleRedeemOk = async (e) => {
    let { redeemResults} = this.state;
    const form = this.refs.myForm;
    const values = form.getFieldsValue(['redeemInput'])
    let inputAmount = values.redeemInput;
    let that = this;
    if(inputAmount !==undefined){
      this.props.dispatch({
        type: 'account/submitRedeem',
        payload: { results: redeemResults,inputAmount:inputAmount}
      }).then(() =>{
        that.setState({
          redeemVisible: false,
          checkMax: false
        })
        that.props.dispatch({
          type: 'account/login'
        });
      })
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
      let that = this
      const value = literalToReal(repayInput, repayResults[0].underlyingDecimals)
      const showApprove = await that.props.dispatch({ type: 'market/getShowApprove', payload: { address:address,account: globals.loginAccount,value:value}})
      that.setState({
        showApprove: showApprove
      })
    }else if(type ===1){
      let redeemInput = selectedPoolItem.rTokenBalanceLiteral
      const form = this.refs.myForm;
      form.setFieldsValue({ redeemInput : redeemInput})
    }
  }


  columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (_, { underlyingSymbol},index) => {
        let icon = underlyingSymbol ==='ETH' ? ETH : DOL;
        let iconUrl
        let iconList = this.state.iconList;
        let symbol = underlyingSymbol.toLowerCase();
        if(symbol[0] ==='r'){
          iconUrl = symbol.substr(1)
        }else if(symbol === 'eth'){
          iconUrl = 'heth'
        }else {
          iconUrl = symbol
        }
        return (
          <div className={styles.nameArea}>
            <img src={require('../../../public/'+iconUrl+'.svg')}/>
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
      render: (_,{underlyingSymbol,tokenBalanceLiteral,collateralBalanceLiteral,borrowBalanceLiteral,rTokenBalanceLiteral}) => {
        let item = {
          underlyingSymbol: underlyingSymbol,
          tokenBalanceLiteral:tokenBalanceLiteral,
          collateralBalanceLiteral:collateralBalanceLiteral,
          borrowBalanceLiteral: borrowBalanceLiteral,
          rTokenBalanceLiteral: rTokenBalanceLiteral
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
    const { selectedPoolItem,iconList } = this.state;
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
                  <NumberCard title='Balance' number={account.rds.balanceLiteral} lg={24} unit='RDS' position='right'  big={true} decimals={4} theme={theme}/>
                </Card>
                <Card
                  bordered={false}
                  bodyStyle={{
                    padding: '0 25px',
                  }}>
                  <Table columns={this.columns} dataSource={account.sheets}  rowKey="underlyingSymbol" pagination={false} />
                </Card>
              </div> :
              <div className={appStyles.loading}>
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
            <p className={styles.connectedBtn} onClick={this.connectWallet.bind(this)}><img src={metaMask}/> Connect wallet</p>
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
            className={theme === 'dark' ? appStyles.modalDark : ''}
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
            <div className={appStyles.dialogContent}>
              <div className={appStyles.title}>
                <h3 className={appStyles.dialogTitle}>Repay {selectedPoolItem.underlyingSymbol}</h3>
              </div>
              <div className={appStyles.inputArea}>
                <div className={appStyles.inputDes}>
                  <p className={appStyles.des}>Total Debts<span> {selectedPoolItem.borrowBalanceLiteral.toFixed(4)}</span></p>
                  <p className={appStyles.des}>Total Balance<span>{selectedPoolItem.tokenBalanceLiteral.toFixed(4)}</span></p>
                </div>
                <div className={appStyles.inputContent}>
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
                      <Input placeholder='Input repay amount' type='text'/>
                    </FormItem>
                  </Form>
                  <Button className={[appStyles.maxBtn,this.state.checkMax ? appStyles.checkedNumberBtn : '']} onClick={this.checkNumber.bind(this,0)}>MAX</Button>
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
            className={theme === 'dark' ? appStyles.modalDark : ''}
            footer={[
              <Button key="submit" type="primary"  onClick={this.handleRedeemOk}>
                Redeem
              </Button>,
            ]}
          >
            <div className={appStyles.dialogContent}>
              <div className={appStyles.title}>
                <h3 className={appStyles.dialogTitle}>Redeem {selectedPoolItem.underlyingSymbol}</h3>
              </div>
              <div className={appStyles.inputArea}>
                <div className={appStyles.inputDes}>
                  <p className={appStyles.des}>Allowed Amount<span>{this.state.redeemResults[0].rTokenBalanceLiteral.toFixed(4)}</span></p>
                  {/*<p className={styles.des}>Exchange Rate:1.1</p>*/}
                </div>
                <div className={appStyles.inputContent}>
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
                      <Input placeholder='Input redeem amount' type='text'/>
                    </FormItem>
                  </Form>
                  <Button className={[appStyles.maxBtn,this.state.checkMax ? appStyles.checkedNumberBtn : '']} onClick={this.checkNumber.bind(this,1)}>MAX</Button>
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
