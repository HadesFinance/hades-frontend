import React, { PureComponent } from 'react';
import { Col } from 'antd'
import CountUp from 'react-countup'
import styles from './numberCard.less'


class NumberCard extends PureComponent {
  render(){
    const { lg,title,number,countUp,unit,position,big,decimals,theme,effective } = this.props;
    console.log(number)
    return (
      <Col lg={lg} className={theme === 'dark' ? styles.numberCardDark : ''}>
        <p className={big ? styles.titleBig : styles.title}>{title}</p>
        <p className={big ? styles.numberBig : styles.number}>
          {position === 'left' && unit !=='' ? <span>{unit}</span> : ''}
          {effective ? <span>{number.toPrecision(4)}</span> :
            <CountUp
              start={0}
              end={Number(number)}
              duration={0.5}
              useEasing
              useGrouping
              separator=","
              decimals={decimals ? decimals : 0}
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
