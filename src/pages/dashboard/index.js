import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect, withRouter } from 'umi';
import { Row, Col, Card } from 'antd'
import { Page, } from 'components'
import styles from './index.less'
import dol from '../../../public/DOL.svg';
import ethereum from '../../../public/ethereum_L.svg';
import {
  NumberCard,
} from './components'

@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class Dashboard extends PureComponent {
  state = {
  };

  onCollapseChange = collapsed => {
    this.props.dispatch({
      type: 'app/handleCollapseChange',
      payload: collapsed,
    })
  }

  componentDidMount() {
    this.props.dispatch({
      type: 'overview/queryOverview'
    })
  }

  render() {
    const { app, overview, } = this.props
    const { theme, } = app
    return (
      <Page
        // loading={loading.models.dashboard && sales.length === 0}
        className={theme === 'dark' ? styles.darkPage : styles.dashboard}
      >
        <Row gutter={24}>
          <Col lg={12} md={24}>
            <Card
              bordered={false}
              bodyStyle={{
                padding: '0',
              }}>
              <div className={styles.topLeft}>
                <NumberCard title='TVL' number={overview.totalSupplyAccLiteral}  decimals={4} lg={24} unit='$' position='left' big={true} theme={theme}/>
              </div>
              <Row lg={24} className={styles.topLeftBottom}>
                <NumberCard title='Total Borrows' number={overview.totalBorrowsAccLiteral}  lg={12} unit='$' position='left' theme={theme} decimals={4} />
                <NumberCard title='Total Reserves' number={overview.totalReservesAccLiteral} lg={12} unit='$' position='left' decimals={4} theme={theme}/>
              </Row>
            </Card>
          </Col>
          <Col lg={12}>
            <Card
              bordered={false}
              bodyStyle={{
                padding: '0',
              }}>
              <div className={styles.topRight}>
                <p className={styles.cardTitle}>HDS</p>
                <Row lg={24}>
                  <NumberCard title='Circulating' number={overview.hds.circulating} lg={12} unit='' theme={theme}/>
                  <NumberCard title='Mined' number={overview.hds.mined} lg={12} unit='' theme={theme}/>
                </Row>
              </div>
            </Card>
            <Card
              bordered={false}
              bodyStyle={{
                padding: '0',
              }}>
              <div className={styles.topRight}>
                <p className={styles.cardTitle}>DOL</p>
                <Row lg={24}>
                  <NumberCard title='Total Supply' number={overview.dol.totalSupply} lg={24} unit='' theme={theme}/>
                </Row>
              </div>
            </Card>
          </Col>
        </Row>
        <Card
          bordered={false}
          bodyStyle={{
            padding: '0',
          }}>
          <div className={styles.coinArea}>
            <div className={styles.coinTitle}>
              <img src={ethereum}/>
              <span>ETH</span>
            </div>
            <Row lg={24}>
              <NumberCard title='Total Supply' number={overview.markets[0].totalSupplyLiteral ? overview.markets[0].totalSupplyLiteral : 0} lg={8} unit='ETH' position='right' decimals={4} theme={theme} />
              <NumberCard title='Total Borrows' number={overview.markets[0].totalBorrowsLiteral ? overview.markets[0].totalBorrowsLiteral : 0} lg={8} unit='ETH' position='right' decimals={3} theme={theme} />
              <NumberCard title='Total Reserves' number={overview.markets[0].totalReservesLiteral ? overview.markets[0].totalReservesLiteral : 0} lg={8} unit='ETH' position='right' decimals={4} theme={theme}/>
            </Row>
          </div>
        </Card>
        <Card
          bordered={false}
          bodyStyle={{
            padding: '0',
          }}>
          <div className={styles.coinArea}>
            <div className={styles.coinTitle}>
              <img src={dol}/>
              <span>DOL</span>
            </div>
            <Row lg={24}>
              <NumberCard title='Total Supply' number={overview.markets[1].totalSupplyLiteral ? overview.markets[1].totalSupplyLiteral : 0} lg={8} unit='DOL' position='right' decimals={4} theme={theme}/>
              <NumberCard title='Total Borrows' number={overview.markets[1].totalBorrowsLiteral ? overview.markets[1].totalBorrowsLiteral : 0} lg={8} unit='DOL' position='right' decimals={4} theme={theme}/>
              <NumberCard title='Total Reserves' number={overview.markets[1].totalReservesLiteral ? overview.markets[1].totalReservesLiteral : 0} lg={8} unit='DOL' position='right' decimals={4} theme={theme}/>
            </Row>
          </div>
        </Card>
      </Page>
    )
  }
}

Dashboard.propTypes = {
  dashboard: PropTypes.object,
  loading: PropTypes.object,
}
function mapStateToProps(state) {
  console.log(state);
  return {
    overview: state.overview.overview
  };
}

export default connect(mapStateToProps)(Dashboard);
