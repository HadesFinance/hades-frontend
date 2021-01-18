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
    liquidityList:[],
    repayVisible: false,
    repayEnable: false,
    showApprove: true,
    checkMax: false,
    current:1,
    liquidityCount:11,
    selectedIndex: '',
    maxRepay:0,
    seizeTokens:0,
    selectedBalanceList:['rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH'],
    selectedBorrowList:['rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH'],
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
        selectedBalanceSymbol = selectedBalanceSymbol ? selectedBalanceSymbol : 'rETH';
        let selectedBalanceList = this.props.selectedBalanceList
        return (
          <div className={styles.nameArea}>
            <Select
              defaultValue="rETH"
              onChange={this.handleChange.bind(this,index)}
            >
              <Option value="rETH">ETH</Option>
              <Option value="rDOL">DOL</Option>
              <Option value="rBTC">BTC</Option>
              <Option value="rTRX">TRX</Option>
            </Select>
            <span>{collaterals[selectedBalanceList[index]] ? collaterals[selectedBalanceList[index]].toFixed(4) : '0.0000'}</span>
          </div>
        );
      },
    },{
      title: 'Borrows',
      dataIndex: 'borrows',
      render: (_, { borrows,selectedBorrowSymbol,account},index) => {
        let selectedBorrowList  = this.props.selectedBorrowList
        selectedBorrowSymbol = selectedBorrowSymbol ? selectedBorrowSymbol : 'rETH';
        return (
          <div className={styles.nameArea}>
            <Select
              defaultValue="rETH"
              onChange={this.handleChangeBorrow.bind(this,index)}
            >
              <Option value="rETH">ETH</Option>
              <Option value="rDOL">DOL</Option>
              <Option value="rBTC">BTC</Option>
              <Option value="rTRX">TRX</Option>
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
    let { selectedBalanceList } = this.props;
    let newList = [...selectedBalanceList];
    newList[index] = value
    this.props.dispatch({
      type: 'liquidity/updateBalance',
      payload:{ selectedBalanceList: newList}
    })
  }

  handleChangeBorrow(index,value){
    let { selectedBorrowList } = this.props;
    let newList = [...selectedBorrowList];
    newList[index] = value
    this.props.dispatch({
      type: 'liquidity/updateBorrow',
      payload:{ selectedBorrowList: newList}
    })
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
      const maxRepay = await globals.realDAO.getMaxRepay(repaySymbol, borrowerAddress)
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
      const decimals = globals.realDAO._marketInfo[repaySymbol].underlyingDecimals
      const liquidateAmount = literalToReal(liquidateAmountLiteral, decimals);
      const seizeTokens = await globals.realDAO.calculateSeizeTokens(repaySymbol, collateralSymbol, liquidateAmount)
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
        const decimals = globals.realDAO._marketInfo[repaySymbol].underlyingDecimals
        const liquidateAmount = literalToReal(liquidateAmountLiteral, decimals)

        const collateralAddress = globals.realDAO._marketInfo[collateralSymbol].rToken
        const rToken = globals.realDAO.rToken(repaySymbol)
        let transaction
        if (repaySymbol === 'ETH') {
          transaction = rToken
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
            const underlyingAddress = globals.realDAO._marketInfo[repaySymbol].underlyingAssetAddress
            console.log('demoLiquidate underlyingAddress', underlyingAddress)

            const erc20Token = await globals.realDAO.erc20Token(underlyingAddress)
            const repayTokenAddress = globals.realDAO._marketInfo[repaySymbol].rToken
            await erc20Token.approve(repayTokenAddress, MAX_UINT256).send({ from: liquidator })
            this.setState({
              repayEnable:true
            })
          }else {
            let that = this;
            that.setState({
              repayEnable:true,
            },function() {
              that.handleRepayDol(rToken, borrowerAddress, liquidateAmount, collateralAddress,liquidator)
            })
          }
        }
      }
    }else {
      alert('Please connect the wallet')
    }
  }

  handleRepayDol = async (rToken, borrowerAddress, liquidateAmount, collateralAddress,liquidator,e) => {
    let { repayEnable } = this.state;
    if(repayEnable){
      let transaction = rToken.liquidateBorrow(borrowerAddress, liquidateAmount, collateralAddress).send({ from: liquidator })
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
      const decimals = globals.realDAO._marketInfo[repaySymbol].underlyingDecimals
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
      payload: { offset:(current -2) *10, limit: 10 }
    })
    this.setState({
      current: current -1,
      selectedBalanceList:['rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH'],
      selectedBorrowList:['rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH'],
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
      selectedBalanceList:['rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH'],
      selectedBorrowList:['rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH','rETH'],
    })
  }


  render() {
    const {  current,selectedIndex,maxRepay,seizeTokens,selectedBorrowList, } = this.state;
    const { app,liquidityList, pageLoading,liquidityCount,selectedBalanceList  } = this.props
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
              <p className={appStyles.page}>Page {current} of {liquidityCount > 0 ? Math.ceil(liquidityCount / 10) : '1'}</p>
              <RightCircleFilled className={(current === Math.ceil(liquidityCount / 10)) || liquidityCount ===0 ? appStyles.disabledBtn : appStyles.next}
                onClick={(current === Math.ceil(liquidityCount / 10)) || liquidityCount ===0 ? null : this.nextPage.bind(this)}
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
    pageLoading: state.liquidity.pageLoading,
    selectedBalanceList: state.liquidity.selectedBalanceList,
    selectedBorrowList: state.liquidity.selectedBorrowList
  };
}

export default connect(mapStateToProps)(Liquidity);
