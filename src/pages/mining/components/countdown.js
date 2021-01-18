import React, { PureComponent } from 'react';
import { Col,Row } from 'antd'
import styles from './tableInfo.less'
import CountUp from 'react-countup';


class Countdown extends PureComponent {
  state = {
    countdown:''
  }
  componentDidMount() {
    let that = this;
    let countdownValue = that.props.countdown;
    that.intervalId = setInterval(function () {
      countdownValue = countdownValue >0 ? countdownValue -1 : 0
      that.setState({
        countdown: countdownValue
      })
    }.bind(this), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId)
  }


  render(){
    const { countdown } = this.state;
    return (
      <span>Countdown: {countdown}</span>
    )
  }
}


export default Countdown
