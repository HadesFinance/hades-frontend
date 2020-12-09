/* global window */
/* global document */
import React, { PureComponent, Fragment } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'umi'
import { connect } from 'umi'
import { MyLayout, GlobalFooter } from 'components'
import { BackTop, Layout, Drawer } from 'antd'
import { enquireScreen, unenquireScreen } from 'enquire-js'
import { config, getLocale } from 'utils'
import Error from '../pages/404'
import styles from './PrimaryLayout.less'
import store from 'store'
const { pathToRegexp } = require("path-to-regexp")

const { Content } = Layout
const { Header, Bread, Sider } = MyLayout

@withRouter
@connect(({ app, loading }) => ({ app, loading }))
class PrimaryLayout extends PureComponent {
  state = {
    isMobile: false,
  }

  componentDidMount() {
    this.enquireHandler = enquireScreen(mobile => {
      const { isMobile } = this.state
      if (isMobile !== mobile) {
        this.setState({
          isMobile: mobile,
        })
      }
    })
    this.props.dispatch({
      type: 'app/query',
    })
  }

  componentWillUnmount() {
    unenquireScreen(this.enquireHandler)
  }

  onCollapseChange = collapsed => {
    this.props.dispatch({
      type: 'app/handleCollapseChange',
      payload: collapsed,
    })
  }

  render() {
    const { app, location, dispatch, children } = this.props
    const { theme, collapsed, notifications } = app
    const routeList = store.get('routeList') || []
    const { isMobile } = this.state
    const { onCollapseChange } = this

    // Localized route name.

    const lang = getLocale()
    const newRouteList =
      lang !== 'en'
        ? routeList.map(item => {
          const { name, ...other } = item
          return {
            ...other,
            name: (item[lang] || {}).name || name,
          }
        })
        : routeList

    // Find a route that matches the pathname.
    const currentRoute = newRouteList.find(
      _ => _.route && pathToRegexp(_.route).exec(location.pathname)
    )


    // MenuParentId is equal to -1 is not a available menu.
    const menus = newRouteList.filter(_ => _.menuParentId !== '-1')

    const headerProps = {
      theme,
      menus,
      collapsed,
      onCollapseChange,
      fixed: config.fixedHeader,
      onAllNotificationsRead() {
        dispatch({ type: 'app/allNotificationsRead' })
      },
      onSignOut() {
        dispatch({ type: 'app/signOut' })
      },
      onThemeChange(theme) {
        dispatch({
          type: 'app/handleThemeChange',
          payload: theme,
        });
        console.log('theme='+theme)
      },
    }

    const siderProps = {
      theme,
      menus,
      isMobile,
      collapsed,
      onCollapseChange,
      onThemeChange(theme) {
        dispatch({
          type: 'app/handleThemeChange',
          payload: theme,
        });
        console.log('theme='+theme)
      },
    }

    return (
      <Fragment>
        <Layout>
          {isMobile ? (
            <Drawer
              maskClosable
              closable={false}
              onClose={onCollapseChange.bind(this, !collapsed)}
              visible={!collapsed}
              placement="left"
              width={200}
              style={{
                padding: 0,
                height: '100vh',
              }}
            >
              <Sider {...siderProps} collapsed={false} />
            </Drawer>
          ) : (
            <Sider {...siderProps} />
          )}
          <div
            className={theme ==='dark' ? styles.containerDark : styles.container}
            style={{ paddingTop: config.fixedHeader ? 80 : 0 }}
            id="primaryLayout"
          >
            <Header {...headerProps} />
            <Content className={[styles.content, theme === 'dark' ? styles.contentDark : '']}>
              {children}
            </Content>
          </div>
        </Layout>
      </Fragment>
    )
  }
}

PrimaryLayout.propTypes = {
  children: PropTypes.element.isRequired,
  location: PropTypes.object,
  dispatch: PropTypes.func,
  app: PropTypes.object,
  loading: PropTypes.object,
}

export default PrimaryLayout
