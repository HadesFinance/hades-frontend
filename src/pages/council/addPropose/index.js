import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect, withRouter } from 'umi';
import { Form, Input, Button, Space, message } from 'antd';
import { Page, } from 'components'
import styles from './index.less'
import { history } from 'umi'
import { LoadingOutlined, LeftOutlined, MinusCircleOutlined, PlusOutlined, PlusCircleFilled } from '@ant-design/icons'
import eth from '../../../../public/ETH.svg'
import delete_icon from '../../../../public/delete.svg'
import store from 'store';

@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class AddPropose extends PureComponent {
  state = {
    pageLoading: false,

  };

  componentDidMount() {

  }

  componentWillUnmount() {
  }

  goBack(){
    history.go(-1)
  }

  goCouncil(){
    history.push({
      pathname: '/council',
      query: {}
    })
  }

  onFinish = (values) => {
    console.log('Success:', values);
    let target = values.target;
    let value = values.value ? values.value : 0;
    let signature = values.signature;
    let delay = values.delay;
    let votingPeriod = values.voting_period;
    let desc = values.desc;
    let paramValues = values.parameters.map(item => item.params ? item.params : '');
    let that = this;
    that.props.dispatch({
      type: 'council/addPropose',
      payload: {
        target:target,
        value:value,
        signature:signature,
        delay:delay,
        votingPeriod:votingPeriod,
        desc:desc,
        paramValues:paramValues
      }
    }).then((res) => {
      console.log(res.success);
      if(res.success){
        message.success('Proposal added successfully!');
        that.goCouncil()
      }
    })
  };

  onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  render() {
    const {  } = this.state;
    const { app, pageLoading, } = this.props
    const { theme, } = app
    return (
      <Page
        // loading={loading.models.dashboard && sales.length === 0}
        className={theme === 'dark' ? styles.darkPage : styles.liquidity}
      >
        {!pageLoading ?
          <div>
            <div className={styles.pageTitle}>
              <LeftOutlined style={{fontSize: 14+'px',color: '#808191',cursor: 'pointer'}} onClick={() => this.goBack()} />
              <span className={styles.detailId}>New Proposal</span>
            </div>
            <div className={styles.formArea}>
              <Form
                name="basic"
                onFinish={this.onFinish}
                onFinishFailed={this.onFinishFailed}
                initialValues={{"parameters": [{
                    fieldKey: 0,
                    isListField: true,
                    key: 0,
                    name: 0,
                    params: "",
                  }]}}
              >
                <div className={styles.valueInput}>
                  <Form.Item
                    label="Value"
                    name="value"
                  >
                    <Input placeholder='0.00' />
                  </Form.Item>
                  <div className={styles.valueUnit}><img src={eth}/>ETH </div>
                </div>
                <div className={styles.flexInput}>
                  <Form.Item
                    label="Target"
                    name="target"
                    rules={[{ required: true, message: 'Please input target!' }]}
                  >
                    <Input placeholder='Target' />
                  </Form.Item>
                  <Form.Item
                    label="Signature"
                    name="signature"
                    rules={[{ required: true, message: 'Please input signature!' }]}
                  >
                    <Input placeholder='Signature' />
                  </Form.Item>
                </div>
                <div className={styles.flexInput}>
                  <Form.Item
                    label="delay"
                    name="delay"
                    rules={[{ required: true, message: 'Please input delay!' }]}
                  >
                    <Input placeholder='delay' />
                  </Form.Item>
                  <Form.Item
                    label="voting Period"
                    name="voting_period"
                    rules={[{ required: true, message: 'Please input voting period!' }]}
                  >
                    <Input placeholder='voting Period' />
                  </Form.Item>
                </div>
                <Form.Item
                  label="desc"
                  name="desc"
                  rules={[{ required: true, message: 'Please input desc!' }]}
                >
                  <Input placeholder='desc' />
                </Form.Item>
                <div className={styles.paramsArea}>
                  <p className={styles.paramsTitle}>Parameters</p>
                  <Form.List name="parameters">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(field => (
                          <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                            <Form.Item
                              {...field}
                              name={[field.name, 'params']}
                              fieldKey={[field.fieldKey, 'params']}
                            >
                              <Input placeholder="Value" />
                            </Form.Item>
                            <img src={delete_icon} onClick={() => remove(field.name)} style={{cursor: 'pointer'}}/>
                          </Space>
                        ))}
                        <PlusCircleFilled onClick={() => add()} className={styles.addBtn}/>
                      </>
                    )}
                  </Form.List>
                </div>
                <Form.Item>
                  <Button type="primary" htmlType="submit" className={styles.submitBtn}>
                    Submit
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </div> :
          <div className={styles.loading}>
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

  };
}

export default connect(mapStateToProps)(AddPropose);
