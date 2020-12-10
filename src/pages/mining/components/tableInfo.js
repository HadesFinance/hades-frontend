import React from 'react'
import { Col,Row } from 'antd'
import styles from './tableInfo.less'


function TableInfo({ total_power,my_power,start_block,apy,claimed,unclaimed,theme }) {
  return (
    <Row lg={24} className={[styles.tableInfo,theme === 'dark' ? styles.tableInfoDark : '']}>
      <Col lg={12}>
        <Row lg={24} className={styles.title}>Total Power</Row>
        <Row lg={24} className={styles.valueBig}>{total_power}</Row>
        <Row lg={24} className={styles.title}>My Power</Row>
        <Row lg={24} className={styles.valueBig}>{my_power}</Row>
      </Col>
      <Col lg={12}>
        <Row lg={24} className={styles.rightRow}>
          <span className={styles.title}>Start Block</span>
          <span className={styles.value}>{start_block}</span>
        </Row>
        <Row lg={24} className={styles.rightRow}>
          <span className={styles.title}>APY</span>
          <span className={styles.value}>{apy}%</span>
        </Row>
        <Row lg={24} className={styles.rightRow}>
          <span className={styles.title}>Claimed</span>
          <span className={styles.value}>{claimed}</span>
        </Row>
        <Row lg={24} className={styles.rightRow}>
          <span className={styles.title}>Unclaimed</span>
          <span className={styles.value}>{unclaimed}</span>
        </Row>
      </Col>
    </Row>
  )
}


export default TableInfo
