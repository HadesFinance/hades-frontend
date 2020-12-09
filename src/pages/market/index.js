import React, { PureComponent } from 'react'
import { connect, withRouter } from 'umi';
import { Card, Progress, Modal, Input, Button, Form } from 'antd';
import { Page, } from 'components'
import styles from './index.less'
import ethereum from '../../../public/ethereum_L.svg';
import DOL from '../../../public/DOL.svg'
import { globals} from '../../utils/constant';
import Hades from '../../utils/hades';
import store from 'store';
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
    supplyBalanceInfo:{},
  };

  componentDidMount() {
    this.props.dispatch({
      type: 'market/queryMarket'
    });
  }


  showModal = async (index) => {
    let account = globals.loginAccount;
    let {market} = this.props;
    let selectedMarketItem = market[index];
    if(account){
      this.setState({
      repayVisible: true,
      selectedMarketItem: selectedMarketItem
    });
      const network = store.get('network');
      let hades = (globals.hades = new Hades(network))
      await hades.setProvider(window.web3.currentProvider);
      let symbol = market[index].underlyingSymbol;
      const address = globals.hTokenMap.get(symbol);
      if (!symbol || !address) {
        alert('Please get symbol and hToken first!')
        throw new Error('Failed to get hToken address')
      }
      let that = this;
      globals.hades.getHTokenBalances(address, globals.loginAccount).then(function(s) {
        console.log(s);
        that.setState({
          supplyBalanceInfo: s
        })
      });
    }else {
      alert('Please connect the wallet')
    }
  };

  handleOk = async (e) => {
    const form = this.formRef.current;
    let balanceInfo = this.state.supplyBalanceInfo;
    let symbol = this.state.selectedMarketItem.underlyingSymbol;
    const address = await globals.hTokenMap.get(symbol);
    const values = form.getFieldsValue(['supplyInput'])
    let inputAmount = values.supplyInput;
    if(inputAmount !==undefined) {
      const value = await this.literalToReal(inputAmount, balanceInfo.underlyingDecimals);
      console.log('value=' + value)
      let that = this;
      const hToken = await globals.hades.hToken(symbol, address)

      let tx
      if (symbol === 'ETH') {
        tx = hToken.mint().send({ value: value.toString(), from: globals.loginAccount })
      } else {
        tx = hToken.mint(inputAmount).send({ from: globals.loginAccount })
      }
      await that.launchTransaction(tx);
      that.setState({
        repayVisible: false,
        checkedNumber: [false, false, false]
      });
      this.props.dispatch({
        type: 'market/queryMarket'
      });
    }
  }
  ;

  handleCancel = e => {
    this.setState({
      repayVisible: false,
      checkedNumber: [false,false,false]
    });
  };

  showRedeemModal = async (index) => {
    const account = globals.loginAccount
    let {market} = this.props;
    let selectedMarketItem = market[index];
    console.log('account='+account)
    if(account){
      this.setState({
        redeemVisible: true,
        selectedMarketItem: selectedMarketItem
      });
      const network = store.get('network');
      let hades = (globals.hades = new Hades(network))
      await hades.setProvider(window.web3.currentProvider);
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
      const balanceInfo = results[0]
      console.log('demoBorrow results[2', results)
      let borrowLimit
      if (symbol !== 'DOL') {
        borrowLimit = results[2].liquidity / Number(results[1].underlyingPrice)
      } else {
        borrowLimit = results[2].liquidityLiteral
      }
      console.log('borrowLimit:'+borrowLimit);
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
      const realAmount = await this.literalToReal(inputAmount, balanceInfo.underlyingDecimals)
      const hToken = results[3]
      await this.launchTransaction(hToken.borrow(realAmount).send({ from: account }))
      this.setState({
        redeemVisible: false,
        checkedNumber: [false, false, false]
      });
      this.props.dispatch({
        type: 'market/queryMarket'
      });
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


  handleRedeemCancel = e => {
    this.setState({
      redeemVisible: false,
      checkedNumber: [false,false,false]
    });
  };

  checkNumber(index,multiple,type){
    let { checkedNumber, borrowLimit, supplyBalanceInfo } = this.state;
    let isChecked = checkedNumber[index];
    checkedNumber = [false,false,false];
    checkedNumber[index] = !isChecked
    this.setState({
      checkedNumber: checkedNumber
    });
    if(type ===0){//type=0 is supply,=1 is  borrow
      let supplyInput = supplyBalanceInfo.tokenBalanceLiteral * multiple
      const form = this.formRef.current;
      form.setFieldsValue({ supplyInput : supplyInput})
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
    const { app, market,  } = this.props
    const { theme,  } = app
    const { selectedMarketItem } = this.state;
    return (
      <Page
        // loading={loading.models.dashboard && sales.length === 0}
        className={theme === 'dark' ? styles.darkPage : styles.market}
      >
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
              <p className={styles.progressText}>Avaiable：{item.totalCashLiteral} {item.underlyingSymbol}</p>
            </div>
            <div className={styles.borrowSupply}>
              <div className={styles.item}>
                <p className={styles.title}>Borrow Rate</p>
                <p className={styles.number}>{item.borrowRatePerYear}</p>
              </div>
              <div className={styles.item}>
                <p className={styles.title}>Supply Rate</p>
                <p className={styles.number}>{item.supplyRatePerYear}</p>
              </div>
            </div>
            <div className={styles.btnList}>
              <p className={styles.btnItem} onClick={this.showModal.bind(this,index)}>Supply</p>
              <p className={styles.btnItem} onClick={this.showRedeemModal.bind(this,index)}>Borrow</p>
            </div>
          </Card>
        )}
        <Modal
          title=""
          visible={this.state.repayVisible}
          cancelText='Approve'
          okText='Supply'
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          className={theme === 'dark' ? styles.modalDark : ''}
        >
          <div className={styles.dialogContent}>
            <div className={styles.title}>
              <h3 className={styles.dialogTitle}>Supply {selectedMarketItem.underlyingSymbol}</h3>
            </div>
            <div className={styles.inputArea}>
              <div className={styles.inputDes}>
                <p className={styles.des}>Total:{this.state.supplyBalanceInfo.tokenBalanceLiteral}</p>
                <p className={styles.des}>Exchange Rate:{selectedMarketItem.exchangeRateLiteral}</p>
              </div>
              <div className={styles.inputContent}>
                <Form
                  ref={this.formRef}
                  initialvalues={{
                    supplyInput: 0
                  }}
                  onFinish={this.handleOk}
                >
                  <FormItem name='supplyInput' rule={[
                    {required: true, message: 'Input supply amount'}
                  ]}>
                    <Input placeholder='Input supply amount' type='number'/>
                  </FormItem>
                </Form>
                <Button className={[styles.maxBtn,this.state.checkedNumber[0] ? styles.checkedNumberBtn : '']} onClick={this.checkNumber.bind(this,0,1,0)}>MAX</Button>
              </div>
            </div>
          </div>
        </Modal>
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
          className={theme === 'dark' ? styles.modalDark : ''}
        >
          <div className={styles.dialogContent}>
            <div className={styles.title}>
              <h3 className={styles.dialogTitle}>Borrow {selectedMarketItem.underlyingSymbol}</h3>
            </div>
            <div className={styles.inputArea}>
              <div className={styles.inputDes}>
                <p className={styles.des}>Limit:{this.state.borrowLimit}</p>
                <div className={styles.numberBtnList}>
                  <Button className={[styles.maxBtn,this.state.checkedNumber[0] ? styles.checkedNumberBtn : '']} onClick={this.checkNumber.bind(this,0,0.5,1)}>50%</Button>
                  <Button className={[styles.maxBtn,this.state.checkedNumber[1] ? styles.checkedNumberBtn : '']} onClick={this.checkNumber.bind(this,1,0.75,1)}>75%</Button>
                  <Button className={[styles.maxBtn,this.state.checkedNumber[2] ? styles.checkedNumberBtn : '']} onClick={this.checkNumber.bind(this,2,1,1)}>MAX</Button>
                </div>
              </div>
              <div className={styles.inputContent}>
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
          className={theme === 'dark' ? styles.modalDark : ''}
        >
          <div className={styles.dialogContent}>
            <div className={styles.title}>
              <h3 className={styles.dialogTitle}>{selectedMarketItem.symbol} Market Detail</h3>
            </div>
            <div className={styles.detailContent}>
              <div className={styles.detailList}>
                <div className={styles.detailItem}>
                  <p className={styles.detailTitle}>Symbol</p>
                  <p className={styles.detailValue}>{selectedMarketItem.symbol}</p>
                </div>
                <div className={styles.detailItem}>
                  <p className={styles.detailTitle}>Decimal</p>
                  <p className={styles.detailValue}>{selectedMarketItem.hTokenDecimals}</p>
                </div>
                <div className={styles.detailItem}>
                  <p className={styles.detailTitle}>Name</p>
                  <p className={styles.detailValue}>{selectedMarketItem.name}</p>
                </div>
                <div className={styles.detailItem}>
                  <p className={styles.detailTitle}>Underlying Token</p>
                  <p className={styles.detailValue}>{selectedMarketItem.underlyingSymbol}</p>
                </div>
                <div className={styles.detailItem}>
                  <p className={styles.detailTitle}>Anchor Currency</p>
                  <p className={styles.detailValue}>{selectedMarketItem.anchorSymbol}</p>
                </div>
              </div>
              <div className={styles.detailList}>
                <div className={styles.detailItem}>
                  <p className={styles.detailTitle}>Exchange Rate</p>
                  <p className={styles.detailValue}>{selectedMarketItem.exchangeRateLiteral}</p>
                </div>
                <div className={styles.detailItem}>
                  <p className={styles.detailTitle}>Reserve Factor</p>
                  <p className={styles.detailValue}>{selectedMarketItem.reserveFactorLiteral * 100}%</p>
                </div>
                <div className={styles.detailItem}>
                  <p className={styles.detailTitle}>Collateral Factor</p>
                  <p className={styles.detailValue}>{selectedMarketItem.collateralFactorLiteral * 100}%</p>
                </div>
                <div className={styles.detailItem}>
                  <p className={styles.detailTitle}>Liquidation Incentive</p>
                  <p className={styles.detailValue}>{selectedMarketItem.liquidationIncentiveLiteral *100}%</p>
                </div>
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
    market: state.market.market,
    liquidity: state.account.accountLiquidity.liquidity
  };
}

export default connect(mapStateToProps)(Market);