import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect, withRouter } from 'umi';
import { Row, Col, Card, Popover, Table, Pagination, Select, Modal, Button, Form, Input } from 'antd';
import { Page, } from 'components'
import styles from './index.less'
import { LoadingOutlined, LeftCircleFilled, RightCircleFilled } from '@ant-design/icons'
import linkGray from '../../../public/link_gray.svg';
import linkGreen from '../../../public/link_green.svg';
import liquidityBtn from '../../../public/liquidity-btn.svg'
import store from 'store';
import { globals, literalToReal,launchTransaction,MAX_UINT256 } from '../../utils/constant';
import appStyles from '../app.less';
const { Option } = Select;
const FormItem = Form.Item;


@withRouter
@connect(({ app, loading }) => ({ app, loading }))

class Liquidity extends PureComponent {
  state = {
    pageLoading: false,
    liquidityList:[
      {
      "account":"0x7ace39E63B5f234cFB6D3239Ea326738B88677Cb",
      "collaterals":{
        "hETH":2,
        "hDOL":0,
      },
      "borrows":{
        "hETH":0,
        "hDOL":400.00039639,
      },
      "liquidity":200.07896303,
      "updatedAt":1609736333351,
      "_id":"RK8mnRwF2yd6yZbc",
      "selectedBalanceSymbol":'hETH',
      "selectedBorrowSymbol": 'hETH'
    },{
      "account":"0x2F81c61bc7daBc612757cF60D8a546637fc59359",
      "collaterals":{
        "hETH":0.5,
        "hDOL":450,
      },
      "borrows":{
        "hETH":0.5001657513264255,
        "hDOL":0,
      },
      "liquidity":287.45353946,
      "updatedAt":1609736333852,
      "_id":"odB3RulRV5Gu0dHn",
      "selectedBalanceSymbol":'hETH',
      "selectedBorrowSymbol": 'hETH'
    },{
      "account":"0xf959579eDf47f166f316Bc03887540D5d80AA302",
      "collaterals":{
        "hETH":1.99999987,
      },
      "borrows":{
        "hETH":0,
      },
      "liquidity":-600.07932041,
      "updatedAt":1609736330745,
      "_id":"NnH2t0jwgM3vxnoD",
      "selectedBalanceSymbol":'hETH',
      "selectedBorrowSymbol": 'hETH'
    },{
      "account":"0x48D6c33eE6BD128751e71Ce1B32D2bEF27AbD709",
      "collaterals":{
        "hETH":9,
        "hDOL":0,
      },
      "borrows":{
        "hETH":0,
        "hDOL":2000.00198195,
      },
      "liquidity":700.35513544,
      "updatedAt":1609736332750,
      "_id":"rcCQdHu8wQsbT22p",
      "selectedBalanceSymbol":'hETH',
      "selectedBorrowSymbol": 'hETH'
    },{
      "account":"0xc068577fA749F8B17ab87901151A7C0ff9651a2A",
      "collaterals":{
        "hETH":12.99999907,
        "hDOL":0,
      },
      "borrows":{
        "hETH":3.126027476097089,
        "hDOL":1.00000068,
      },
      "liquidity":2649.10456609,
      "updatedAt":1609736335757,
      "_id":"VpdJtEgeOG8Ub0ri",
      "selectedBalanceSymbol":'hETH',
      "selectedBorrowSymbol": 'hETH'
    },{
      "account":"0x5661cdBc2Ff8ffC5eC8f0fb1F551443CE3068ed4",
      "collaterals":{
        "hETH":9.99999985,
        "hDOL":309.99999995,
      },
      "borrows":{
        "hETH":0,
        "hDOL":500.00049546,
      },
      "liquidity":2732.89625669,
      "updatedAt":1609736334555,
      "_id":"UZ8J6i6gtSjzNIlb",
      "selectedBalanceSymbol":'hETH',
      "selectedBorrowSymbol": 'hETH'
    }, {
      "account": "0x484ca440aDFa0b7A148169342B9d8E4623Ab2D53",
      "collaterals": { "hETH": 9.99867751, "hDOL": 999.99999958 },
      "borrows": { "hETH": 0, "hDOL": 1000.00000017 },
      "liquidity": 2749.99999745,
      "updatedAt": 1609736337461,
      "_id": "9I54LzgT17NdvMRr",
      "selectedBalanceSymbol": 'hETH',
      "selectedBorrowSymbol": 'hETH'
    }
    ],
    repayVisible: false,
    repayEnable: false,
    showApprove: true,
    checkMax: false,
    current:1,
    liquidityCount:11,
    selectedIndex: '',
    maxRepay:0,
    seizeTokens:0,
    selectedBalanceList:['hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH'],
    selectedBorrowList:['hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH'],
  };

  componentDidMount() {
    this.props.dispatch({
      type: 'liquidity/queryLiquidity',
      payload: { offset:0, limit: 10 }
    })
  }

  componentWillUnmount() {
  }

  columns = [
    {
      title: 'Address',
      dataIndex: 'address',
      render: (_, { account}) => {
        let leftStr = account.slice(0,6);
        let rightStr = account.slice(account.length -6);
        const network = store.get('network');
        let etherscan = network.etherscan;
        let processedAccount = leftStr + '...'+ rightStr;
        let etherscanLink = 'https://'+etherscan+'/address/'+account
        return (
          <div className={styles.nameArea}>
            <span>{processedAccount}</span>
            <a href={etherscanLink} className={styles.addressLink}><img src={linkGreen}/> </a>
          </div>
        );
      },
    },
    {
      title: 'Liquidity',
      dataIndex: 'liquidity',
      render: (_, { liquidity}) => {
        return (
          <div className={styles.nameArea}>
            <span className={liquidity >=0 ? styles.greenPrice : styles.redPrice}>{liquidity >=0 ? '$'+liquidity.toFixed(2) : '-$'+(Math.abs(liquidity)).toFixed(2)}</span>
          </div>
        );
      },
    },
    {
      title: 'Balances',
      dataIndex: 'balance',
      render: (_, { collaterals,selectedBalanceSymbol,account},index) => {
        selectedBalanceSymbol = selectedBalanceSymbol ? selectedBalanceSymbol : 'hETH';
        let selectedBalanceList = this.state.selectedBalanceList
        return (
          <div className={styles.nameArea}>
            <Select
              defaultValue="hETH"
              onChange={this.handleChange.bind(this,index)}
            >
              <Option value="hETH">ETH</Option>
              <Option value="hDOL">DOL</Option>
              <Option value="hBTC">BTC</Option>
              <Option value="hTRX">TRX</Option>
            </Select>
            <span>{collaterals[selectedBalanceList[index]] ? collaterals[selectedBalanceList[index]].toFixed(4) : '0.0000'}</span>
          </div>
        );
      },
    },{
      title: 'Borrows',
      dataIndex: 'borrows',
      render: (_, { borrows,selectedBorrowSymbol,account},index) => {
        let selectedBorrowList  = this.state.selectedBorrowList
        selectedBorrowSymbol = selectedBorrowSymbol ? selectedBorrowSymbol : 'hETH';
        return (
          <div className={styles.nameArea}>
            <Select
              defaultValue="hETH"
              onChange={this.handleChangeBorrow.bind(this,index)}
            >
              <Option value="hETH">ETH</Option>
              <Option value="hDOL">DOL</Option>
              <Option value="hBTC">BTC</Option>
              <Option value="hTRX">TRX</Option>
            </Select>
            <span>{borrows[selectedBorrowList[index]] ? borrows[selectedBorrowList[index]].toFixed(4) : '0.0000'}</span>
          </div>
        );
      },
    },{
      title: 'Last Updated',
      dataIndex: 'last_updated',
      render: (_, { updatedAt}) => {
        Date.prototype.toLocaleString = function() {
          function addZero(num) {
            if(num<10)
              return "0" + num;
            return num;
          }
          return this.getFullYear() + "." + addZero(this.getMonth() + 1) + "." + addZero(this.getDate()) + " " +
            addZero(this.getHours()) + ":" + addZero(this.getMinutes()) + ":" + addZero(this.getSeconds());
        };
        let date = new Date(updatedAt);
        let dateTime = date.toLocaleString();
        return (
          <div className={styles.nameArea}>
            <span>{dateTime}</span>
          </div>
        );
      },
    },
    {
      title: '',
      dataIndex: 'operation',
      render: (_, { liquidity },index) => {
        return (
          <div className={styles.btnList}
               style={liquidity <0 ? {opacity: '1'} : {opacity: '0.4'}}
               onClick={liquidity <0 ? this.showModal.bind(this,index) : null}
          >
            <img src={liquidityBtn}/>
          </div>
        );
      },
    },
  ];

  handleChange(index,value){
    let { selectedBalanceList } = this.state;
    selectedBalanceList[index] = value
    this.setState({
      selectedBalanceList: selectedBalanceList
    })
    /*this.props.dispatch({
      type: 'liquidity/handleChangeBalance',
      payload: { index: index, value: value }
    })*/
  }

  handleChangeBorrow(index,value){
    let { selectedBorrowList } = this.state;
    selectedBorrowList[index] = value
    this.setState({
      selectedBorrowList: selectedBorrowList
    })

    /*this.props.dispatch({
      type: 'liquidity/saveLiquidity',
      payload: { liquidityList: liquidityList, liquidityCount: liquidityCount }
    })*/
  }

  async showModal(index){
    if(globals.loginAccount){
      let { liquidityList,} = this.props;
      let { selectedBorrowList } = this.state;
      this.setState({
        repayVisible: true,
        selectedIndex: index
      });
      let selectedLiquidateItem = liquidityList[index];
      let repaySymbol = selectedBorrowList[index].substr(1);
      let borrowerAddress = selectedLiquidateItem.account;
      console.log('repaySymbol='+repaySymbol+'&borrowAddress='+borrowerAddress)
      const maxRepay = await globals.hades.getMaxRepay(repaySymbol, borrowerAddress)
      this.setState({
        maxRepay: maxRepay
      })
    }else {
      alert('Please connect the wallet')
    }
  }

  handleRepayChange = async (e) => {
    let inputValue = e.target.value;
    if(inputValue !==null){
      let liquidityList = this.props.liquidityList;
      let { selectedBorrowList, selectedBalanceList, selectedIndex } = this.state;
      const repaySymbol = selectedBorrowList[selectedIndex].substr(1);
      const collateralSymbol = selectedBalanceList[selectedIndex].substr(1);
      const liquidateAmountLiteral = inputValue;
      const decimals = globals.hades._marketInfo[repaySymbol].underlyingDecimals
      const liquidateAmount = literalToReal(liquidateAmountLiteral, decimals);
      const seizeTokens = await globals.hades.calculateSeizeTokens(repaySymbol, collateralSymbol, liquidateAmount)
      const showApprove = await this.props.dispatch({ type: 'liquidity/getShowApprove', payload: { repaySymbol: repaySymbol, liquidateAmount: liquidateAmount}})
      this.setState({
        seizeTokens: seizeTokens,
        showApprove: showApprove
      })
    }
  }

  handleOk = async (e) =>{
    let { selectedIndex, showApprove, selectedBalanceList, selectedBorrowList } = this.state;
    let liquidityList = this.props.liquidityList;
    const liquidator = globals.loginAccount
    const repaySymbol = selectedBorrowList[selectedIndex].substr(1);
    const borrowerAddress = liquidityList[selectedIndex].account;
    const collateralSymbol = selectedBalanceList[selectedIndex].substr(1);
    const form = this.refs.myForm;
    const values = form.getFieldsValue(['repayInput'])
    const liquidateAmountLiteral = values.repayInput;
    if(liquidator){
      if(liquidateAmountLiteral !==undefined){
        const decimals = globals.hades._marketInfo[repaySymbol].underlyingDecimals
        const liquidateAmount = literalToReal(liquidateAmountLiteral, decimals)

        const collateralAddress = globals.hades._marketInfo[collateralSymbol].hToken
        const hToken = globals.hades.hToken(repaySymbol)
        let transaction
        if (repaySymbol === 'ETH') {
          transaction = hToken
            .liquidateBorrow(borrowerAddress, collateralAddress)
            .send({ from: liquidator, value: liquidateAmount })
          await launchTransaction(transaction);
          this.setState({
            repayVisible: false,
            checkMax: false,
            repayEnable: false
          })
        }else {
          if(showApprove){
            const underlyingAddress = globals.hades._marketInfo[repaySymbol].underlyingAssetAddress
            console.log('demoLiquidate underlyingAddress', underlyingAddress)

            const erc20Token = await globals.hades.underlyingToken(underlyingAddress)
            const repayTokenAddress = globals.hades._marketInfo[repaySymbol].hToken
            await erc20Token.approve(repayTokenAddress, MAX_UINT256).send({ from: liquidator })
            this.setState({
              repayEnable:true
            })
          }else {
            let that = this;
            that.setState({
              repayEnable:true,
            },function() {
              that.handleRepayDol(hToken, borrowerAddress, liquidateAmount, collateralAddress,liquidator)
            })
          }
        }
      }
    }else {
      alert('Please connect the wallet')
    }
  }

  handleRepayDol = async (hToken, borrowerAddress, liquidateAmount, collateralAddress,liquidator,e) => {
    let { repayEnable } = this.state;
    if(repayEnable){
      let transaction = hToken.liquidateBorrow(borrowerAddress, liquidateAmount, collateralAddress).send({ from: liquidator })
      await launchTransaction(transaction);
      this.setState({
        repayVisible: false,
        checkMax: false,
        repayEnable: false
      })
    }else {
      alert('please approve first')
    }
  };

  async checkNumber(type){
    if(type ===0){
      let { checkMax, maxRepay, selectedIndex, selectedBorrowList } = this.state;
      let liquidityList = this.props.liquidityList;
      checkMax = !checkMax
      this.setState({
        checkMax: checkMax
      });
      const form = this.refs.myForm;
      form.setFieldsValue({ repayInput : maxRepay});
      const repaySymbol = selectedBorrowList[selectedIndex].substr(1);
      const decimals = globals.hades._marketInfo[repaySymbol].underlyingDecimals
      const liquidateAmount = literalToReal(maxRepay, decimals)
      const showApprove = await this.props.dispatch({ type: 'liquidity/getShowApprove', payload: { repaySymbol: repaySymbol, liquidateAmount: liquidateAmount}})
      this.setState({
        showApprove: showApprove
      })
    }
  }

  handleCancel = e => {
    this.setState({
      repayVisible: false,
      checkMax: false,
    });
  };

  prevPage(){
    let { current } = this.state;
    this.props.dispatch({
      type: 'liquidity/queryLiquidity',
      payload: { offset:(current -1) *10, limit: 10 }
    })
    this.setState({
      current: current -1,
      selectedBalanceList:['hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH'],
      selectedBorrowList:['hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH'],
    })
  }

  nextPage(){
    let { current } = this.state;
    this.props.dispatch({
      type: 'liquidity/queryLiquidity',
      payload: { offset:current *10, limit: 10 }
    })
    this.setState({
      current: current +1,
      selectedBalanceList:['hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH'],
      selectedBorrowList:['hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH','hETH'],
    })
  }


  render() {
    const {  current,selectedIndex,maxRepay,seizeTokens,selectedBorrowList,selectedBalanceList } = this.state;
    const { app,liquidityList, pageLoading,liquidityCount  } = this.props
    const { theme, } = app
    return (
      <Page
        // loading={loading.models.dashboard && sales.length === 0}
        className={theme === 'dark' ? styles.darkPage : styles.liquidity}
      >
        {!pageLoading ?
          <div>
            <h3 className={styles.listTitle}>Liquidation List</h3>
            <Card
              bordered={false}
              bodyStyle={{
                padding: '0 25px',
              }}>
              <Table columns={this.columns} dataSource={liquidityList}  rowKey="account" pagination={false} />
            </Card>
            <div className={theme === 'dark' ? appStyles.pageAreaDark : appStyles.pageArea}>
              <LeftCircleFilled className={current ===1 ? appStyles.disabledBtn : appStyles.prev} onClick={current ===1 ? null : this.prevPage.bind(this)} />
              <p className={appStyles.page}>Page {current} of {Math.ceil(liquidityCount / 10)}</p>
              <RightCircleFilled className={current === Math.ceil(liquidityCount / 10) ? appStyles.disabledBtn : appStyles.next}
                onClick={current === Math.ceil(liquidityCount / 10) ? null : this.nextPage.bind(this)}
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
        {this.state.repayVisible ?
          <Modal
            title=""
            visible={this.state.repayVisible}
            cancelText='Approve'
            okText='Repay'
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            className={theme === 'dark' ? appStyles.modalDark : ''}
            footer={this.state.showApprove && selectedBorrowList[selectedIndex] !=='hETH' ?
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
                <h3 className={appStyles.dialogTitle}>Repay {selectedBalanceList[selectedIndex].substr(1)} for {selectedBorrowList[selectedIndex].substr(1)}</h3>
              </div>
              <div className={appStyles.inputArea}>
                <div className={appStyles.inputDes}>
                  <p className={appStyles.des}>Max Repay<span>{maxRepay}</span></p>
                  <p className={appStyles.des}>Seized Tokens<span>{seizeTokens}</span></p>
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
      </Page>
    )
  }
}

function mapStateToProps(state) {
  return {
    liquidityCount: state.liquidity.liquidityCount,
    liquidityList: state.liquidity.liquidityList,
    pageLoading: state.liquidity.pageLoading
  };
}

export default connect(mapStateToProps)(Liquidity);
