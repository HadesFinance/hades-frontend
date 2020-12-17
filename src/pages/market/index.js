import React, { PureComponent } from 'react'
import { connect, withRouter } from 'umi';
import { Card, Progress, Modal, Input, Button, Form } from 'antd';
import { Page, } from 'components'
import styles from './index.less'
import appStyles from '../app.less'
import ethereum from '../../../public/ethereum_L.svg';
import DOL from '../../../public/DOL.svg'
import { globals, MAX_UINT256, literalToReal, launchTransaction, init} from '../../utils/constant';
import { LoadingOutlined } from '@ant-design/icons';
const FormItem = Form.Item;

@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class Market extends PureComponent {

  formRef = React.createRef()

  state = {
    repayVisible: false,
    redeemVisible: false,
    checkedNumber:[false,false,false],//50%,70%,max
    detailVisible: false,
    selectedMarketItem:{},
    borrowLimit:'',
    borrowResults:[],
    supplyBalanceInfo:{tokenBalanceLiteral:0},
    supplyEnable: false,
    showApprove: false,
    address: ''
  };

  componentDidMount() {
    let that = this;
    that.props.dispatch({
      type: 'market/queryMarket'
    });
    this.refreshMarket = setInterval(function() {
      that.props.dispatch({
        type: 'market/queryMarket'
      });
    },15000)
  }

  componentWillUnmount() {
    clearInterval(this.refreshMarket)
  }

  showModal = async (index) => {
    let account = globals.loginAccount;
    let {market} = this.props;
    let selectedMarketItem = market[index];
    if(account){
      await init();
      let symbol = selectedMarketItem.underlyingSymbol;
      const address = await this.props.dispatch({ type: 'market/queryAddress', payload: { symbol: symbol} })
      this.setState({
        repayVisible: true,
        selectedMarketItem: selectedMarketItem,
      })
      let that = this;
      const showApprove = await that.props.dispatch({ type: 'market/getShowApprove', payload: { address:address,account: account,value:0}})
      const balanceInfo = await globals.hades.getHTokenBalances(address, globals.loginAccount);
      that.setState({
        supplyBalanceInfo: balanceInfo,
        showApprove: showApprove,
        address: address
      })
    }else {
      alert('Please connect the wallet')
    }
  };

  handleOk = async (e) => {
    let { supplyBalanceInfo,selectedMarketItem,address,showApprove} = this.state;
    let symbol = selectedMarketItem.underlyingSymbol;
    await init();
    const form = this.formRef.current;
    const values = form.getFieldsValue(['supplyInput'])
    let inputAmount = values.supplyInput;
    let that = this;
    if(inputAmount !==undefined) {
      that.props.dispatch({
        type: 'market/submitSupply',
        payload: {
          inputAmount: inputAmount,
          supplyBalanceInfo: supplyBalanceInfo,
          symbol: symbol,
          address: address,
          showApprove: showApprove
        }
      }).then(() => {
        if(symbol === 'ETH'){
          that.setState({
            repayVisible: false,
            checkedNumber: [false, false, false],
            supplyEnable: false,
            selectedMarketItem: {},
            supplyBalanceInfo:{tokenBalanceLiteral:0},
          });
        }else {
          if(showApprove){
            that.setState({
              supplyEnable: true
            })
          }else {
            that.setState({
              supplyEnable: true
            },function() {
              that.handleSupplyDol()
            })
          }
        }
      })
    }
  };

  handleSupplyDol = async (e) => {
    let { supplyBalanceInfo, selectedMarketItem, address, supplyEnable } = this.state;
      if (supplyEnable){
        const form = this.formRef.current;
        await init();
        let symbol = selectedMarketItem.underlyingSymbol;
        const values = form.getFieldsValue(['supplyInput'])
        let inputAmount = values.supplyInput;
        let that = this;
        if(inputAmount !==undefined) {
          that.props.dispatch({
            type: 'market/supplyDol',
            payload: {
              supplyBalanceInfo: supplyBalanceInfo,
              address: address,
              symbol: symbol,
              inputAmount: inputAmount
            }
          }).then(() => {
            that.setState({
              repayVisible: false,
              checkedNumber: [false, false, false],
              supplyEnable: false,
              selectedMarketItem: {},
              supplyBalanceInfo:{tokenBalanceLiteral:0},
            });
          })
        }
      }else {
        alert('please approve first')
      }
    };

  handleCancel = e => {
    this.setState({
      repayVisible: false,
      checkedNumber: [false,false,false],
      supplyBalanceInfo:{tokenBalanceLiteral:0},
      selectedMarketItem:{}
    });
  };

  handleSupplyChange = async (e) => {
    let inputValue = e.target.value;
    if(inputValue !==null){
      let { address, supplyBalanceInfo } = this.state;
      let that = this;
      const account = globals.loginAccount
      const value = literalToReal(inputValue, supplyBalanceInfo.underlyingDecimals)
      const showApprove = await that.props.dispatch({ type: 'market/getShowApprove', payload: { address:address,account: account,value:value}})
      that.setState({
        showApprove: showApprove
      })
    }
  }

  showRedeemModal = async (index) => {
    const account = globals.loginAccount
    let {market} = this.props;
    let selectedMarketItem = market[index];
    if(account){
      this.setState({
        redeemVisible: true,
        selectedMarketItem: selectedMarketItem
      });
      await init()
      let symbol = market[index].underlyingSymbol;
      const address = await globals.hTokenMap.get(symbol);
      if (!symbol || !address) {
        alert('Please get symbol and hToken first!')
        throw new Error('Failed to get hToken address')
      }
      let that = this;
      const results = await Promise.all([
        globals.hades.getHTokenBalances(address, account),
        globals.hades.getPrice(symbol),
        globals.hades.getAccountLiquidity(account),
        globals.hades.hToken(symbol, address),
      ]);
      console.log('demoBorrow results[2', results)
      let borrowLimit
      if (symbol !== 'DOL') {
        borrowLimit = results[2].liquidity / Number(results[1].underlyingPrice)
      } else {
        borrowLimit = results[2].liquidityLiteral
      }
      that.setState({
        borrowLimit: borrowLimit,
        borrowResults: results
      })
    }else {
      alert('Please connect the wallet')
    }
  };

  handleRedeemOk = async (e) => {
    let account = globals.loginAccount
    const form = this.formRef.current;
    let results = this.state.borrowResults;
    let balanceInfo = results[0]
    const values = form.getFieldsValue(['borrowInput'])
    let inputAmount = values.borrowInput;
    if(inputAmount !==undefined) {
      const realAmount = await literalToReal(inputAmount, balanceInfo.underlyingDecimals)
      const hToken = results[3]
      await launchTransaction(hToken.borrow(realAmount).send({ from: account }))
      this.setState({
        redeemVisible: false,
        checkedNumber: [false, false, false]
      });
      this.props.dispatch({
        type: 'market/queryMarket'
      });
    }
  };

  handleRedeemCancel = e => {
    this.setState({
      redeemVisible: false,
      checkedNumber: [false,false,false]
    });
  };

  async checkNumber(index,multiple,type){
    let { checkedNumber, borrowLimit, supplyBalanceInfo,address } = this.state;
    let isChecked = checkedNumber[index];
    checkedNumber = [false,false,false];
    checkedNumber[index] = !isChecked
    this.setState({
      checkedNumber: checkedNumber
    });
    if(type ===0){//type=0 is supply,=1 is  borrow
      let supplyInput = supplyBalanceInfo.tokenBalanceLiteral * multiple
      const form = this.formRef.current;
      form.setFieldsValue({ supplyInput : supplyInput});
      const account = globals.loginAccount
      let that = this
      const value = literalToReal(supplyInput, supplyBalanceInfo.underlyingDecimals);
      const showApprove = await that.props.dispatch({ type: 'market/getShowApprove', payload: { address:address,account: account,value:value}})
      that.setState({
        showApprove: showApprove
      })
    }else if(type ===1){
      let borrowInput = borrowLimit * multiple;
      const form = this.formRef.current;
      form.setFieldsValue({ borrowInput : borrowInput})
    }
  }

  showDetailModal = (index) => {
    let {market} = this.props;
    let selectedMarketItem = market[index];
    this.setState({
      detailVisible: true,
      selectedMarketItem: selectedMarketItem
    });
  };

  handleDetailCancel = e => {
    this.setState({
      detailVisible: false,
  });
  };

  render() {
    const { app, market, pageLoading  } = this.props
    const { theme,  } = app
    const { selectedMarketItem } = this.state;
    return (
      <Page
        // loading={loading.models.dashboard && sales.length === 0}
        className={theme === 'dark' ? styles.darkPage : styles.market}
      >
        {!pageLoading ?
          <div>
            {market.map((item,index) =>
              <Card
                key={index}
                bordered={false}
                bodyStyle={{
                  padding: '25px 20px',
                }}>
                <div className={styles.topArea}>
                  <div className={styles.topLeftArea}>
                    {item.underlyingSymbol ==='ETH' ? <img src={ethereum}/> : ''}
                    {item.underlyingSymbol ==='DOL' ? <img src={DOL}/> : ''}
                    <span>{item.underlyingSymbol}</span>
                  </div>
                  <p className={styles.detailBtn} onClick={this.showDetailModal.bind(this,index)}>Detail</p>
                </div>
                <div className={styles.progressArea}>
                  <Progress percent={(item.totalCashLiteral / item.totalSupplyLiteral) * 100} showInfo={false} strokeColor='#83D420' trailColor={theme === 'dark' ? '#30333D' : '#E2EBF6'} />
                  <p className={styles.progressText}>Avaiable：{item.totalCashLiteral.toFixed(4)} {item.underlyingSymbol}</p>
                </div>
                <div className={styles.borrowSupply}>
                  <div className={styles.item}>
                    <p className={styles.title}>Borrow Rate</p>
                    <p className={styles.number}>{(item.borrowRatePerYear * 100).toFixed(4)}%</p>
                  </div>
                  <div className={styles.item}>
                    <p className={styles.title}>Supply Rate</p>
                    <p className={styles.number}>{(item.supplyRatePerYear * 100).toFixed(4)}%</p>
                  </div>
                </div>
                <div className={styles.btnList}>
                  <p className={styles.btnItem} onClick={this.showModal.bind(this,index)}>Supply</p>
                  <p className={styles.btnItem} onClick={this.showRedeemModal.bind(this,index)}>Borrow</p>
                </div>
              </Card>
            )}
            {this.state.repayVisible ?
              <Modal
                title=""
                visible={this.state.repayVisible}
                cancelText='Approve'
                okText='Supply'
                onOk={this.handleOk}
                onCancel={this.handleCancel}
                className={theme === 'dark' ? appStyles.modalDark : ''}
                footer={selectedMarketItem.underlyingSymbol !=='ETH' && this.state.showApprove ?
                  [
                    <Button key="approve" type="primary"  onClick={this.handleOk}>
                      Approve
                    </Button>,
                    <Button key="supply" type="primary"  onClick={this.handleSupplyDol}>
                      Supply
                    </Button>
                  ] :
                  [
                    <Button key="submit" type="primary"  onClick={this.handleOk}>
                      Supply
                    </Button>
                  ]
                }
              >
                <div className={appStyles.dialogContent}>
                  <div className={appStyles.title}>
                    <h3 className={appStyles.dialogTitle}>Supply {selectedMarketItem.underlyingSymbol}</h3>
                  </div>
                  <div className={appStyles.inputArea}>
                    <div className={appStyles.inputDes}>
                      <p className={appStyles.des}>Total:{Number(this.state.supplyBalanceInfo.tokenBalanceLiteral).toFixed(4)}</p>
                      <p className={appStyles.des}>Exchange Rate:{Number(selectedMarketItem.exchangeRateLiteral).toFixed(4)}</p>
                    </div>
                    <div className={appStyles.inputContent}>
                      <Form
                        ref={this.formRef}
                        initialvalues={{
                          supplyInput: 0
                        }}
                        onFinish={this.handleOk}
                      >
                        <FormItem name='supplyInput' rule={[
                          {required: true, message: 'Input supply amount'}
                        ]} onChange={this.handleSupplyChange}>
                          <Input placeholder='Input supply amount' type='number'/>
                        </FormItem>
                      </Form>
                      <Button className={[appStyles.maxBtn,this.state.checkedNumber[0] ? appStyles.checkedNumberBtn : '']} onClick={this.checkNumber.bind(this,0,1,0)}>MAX</Button>
                    </div>
                  </div>
                </div>
              </Modal> : ''}
            <Modal
              title=""
              visible={this.state.redeemVisible}
              okText='Borrow'
              onOk={this.handleRedeemOk}
              onCancel={this.handleRedeemCancel}
              footer={[
                <Button key="submit" type="primary"  onClick={this.handleRedeemOk}>
                  Borrow
                </Button>,
              ]}
              className={theme === 'dark' ? appStyles.modalDark : ''}
            >
              <div className={appStyles.dialogContent}>
                <div className={appStyles.title}>
                  <h3 className={appStyles.dialogTitle}>Borrow {selectedMarketItem.underlyingSymbol}</h3>
                </div>
                <div className={appStyles.inputArea}>
                  <div className={appStyles.inputDes}>
                    <p className={appStyles.des}>Limit:{Number(this.state.borrowLimit).toFixed(4)}</p>
                    <div className={appStyles.numberBtnList}>
                      <Button className={[appStyles.maxBtn,this.state.checkedNumber[0] ? appStyles.checkedNumberBtn : '']} onClick={this.checkNumber.bind(this,0,0.5,1)}>50%</Button>
                      <Button className={[appStyles.maxBtn,this.state.checkedNumber[1] ? appStyles.checkedNumberBtn : '']} onClick={this.checkNumber.bind(this,1,0.75,1)}>75%</Button>
                      <Button className={[appStyles.maxBtn,this.state.checkedNumber[2] ? appStyles.checkedNumberBtn : '']} onClick={this.checkNumber.bind(this,2,1,1)}>MAX</Button>
                    </div>
                  </div>
                  <div className={appStyles.inputContent}>
                    <Form
                      ref={this.formRef}
                      initialvalues={{
                        borrowInput: 0
                      }}
                      onFinish={this.handleRedeemOk}
                    >
                      <FormItem name='borrowInput' rule={[
                        {required: true, message: 'Input borrow amount'}
                      ]}>
                        <Input placeholder='Input borrow amount' type='number'/>
                      </FormItem>
                    </Form>
                  </div>
                </div>
              </div>
            </Modal>
            <Modal
              title=""
              visible={this.state.detailVisible}
              onCancel={this.handleDetailCancel}
              footer={null}
              className={theme === 'dark' ? appStyles.modalDark : ''}
            >
              <div className={appStyles.dialogContent}>
                <div className={appStyles.title}>
                  <h3 className={appStyles.dialogTitle}>{selectedMarketItem.symbol} Market Detail</h3>
                </div>
                <div className={appStyles.detailContent}>
                  <div className={appStyles.detailList}>
                    <div className={appStyles.detailItem}>
                      <p className={appStyles.detailTitle}>Symbol</p>
                      <p className={appStyles.detailValue}>{selectedMarketItem.symbol}</p>
                    </div>
                    <div className={appStyles.detailItem}>
                      <p className={appStyles.detailTitle}>Decimal</p>
                      <p className={appStyles.detailValue}>{selectedMarketItem.hTokenDecimals}</p>
                    </div>
                    <div className={appStyles.detailItem}>
                      <p className={appStyles.detailTitle}>Name</p>
                      <p className={appStyles.detailValue}>{selectedMarketItem.name}</p>
                    </div>
                    <div className={appStyles.detailItem}>
                      <p className={appStyles.detailTitle}>Underlying Token</p>
                      <p className={appStyles.detailValue}>{selectedMarketItem.underlyingSymbol}</p>
                    </div>
                    <div className={appStyles.detailItem}>
                      <p className={appStyles.detailTitle}>Anchor Currency</p>
                      <p className={appStyles.detailValue}>{selectedMarketItem.anchorSymbol}</p>
                    </div>
                  </div>
                  <div className={appStyles.detailList}>
                    <div className={appStyles.detailItem}>
                      <p className={appStyles.detailTitle}>Exchange Rate</p>
                      <p className={appStyles.detailValue}>{selectedMarketItem.exchangeRateLiteral}</p>
                    </div>
                    <div className={appStyles.detailItem}>
                      <p className={appStyles.detailTitle}>Reserve Factor</p>
                      <p className={appStyles.detailValue}>{selectedMarketItem.reserveFactorLiteral * 100}%</p>
                    </div>
                    <div className={appStyles.detailItem}>
                      <p className={appStyles.detailTitle}>Collateral Factor</p>
                      <p className={appStyles.detailValue}>{selectedMarketItem.collateralFactorLiteral * 100}%</p>
                    </div>
                    <div className={appStyles.detailItem}>
                      <p className={appStyles.detailTitle}>Liquidation Incentive</p>
                      <p className={appStyles.detailValue}>{selectedMarketItem.liquidationIncentiveLiteral *100}%</p>
                    </div>
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
    market: state.market.market,
    liquidity: state.account.accountLiquidity.liquidity,
    pageLoading: state.market.pageLoading
  };
}

export default connect(mapStateToProps)(Market);
