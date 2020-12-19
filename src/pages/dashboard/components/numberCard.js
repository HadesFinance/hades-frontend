import React, { PureComponent } from 'react';
import { Col } from 'antd'
import CountUp from 'react-countup'
import styles from './numberCard.less'


class NumberCard extends PureComponent {
  render(){
    const { lg,title,number,countUp,unit,position,big,decimals,theme,effective,alignCenter,border } = this.props;
    return (
      <Col lg={lg} className={theme === 'dark' ? styles.numberCardDark : ''}
           style={border ? {borderRight: '1px rgba(149,169,201,0.2) solid'} : {border: 'unset'}}
      >
        <p className={big ? styles.titleBig : styles.title} style={alignCenter ? {textAlign: 'center'} : {textAlign: 'left'}}>{title}</p>
        <p className={big ? styles.numberBig : styles.number} style={alignCenter ? {textAlign: 'center'} : {textAlign: 'left'}}>
          {position === 'left' && unit !=='' ? <span>{unit}</span> : ''}
          {effective ? <span>{number}</span> :
            <CountUp
              start={0}
              end={Number(number)}
              duration={0.5}
              useEasing
              useGrouping
              separator=","
              decimals={decimals || decimals ===0 ? decimals : 4}
              {...(countUp || {})}
            />
          }
          {position === 'right' && unit !=='' ? <span className={styles.rightUnit}>{unit}</span> : ''}
        </p>
      </Col>
    )
  }
}


export default NumberCard
