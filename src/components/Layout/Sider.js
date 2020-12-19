import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Switch, Layout, } from 'antd'
import ScrollBar from '../ScrollBar'
import { config } from 'utils'
import SiderMenu from './Menu'
import styles from './Sider.less'
import sun from '../../../public/switch_light.svg'
import moon from '../../../public/switch_dark.svg'
import logo from '../../../public/logo.svg'
import logoDark from '../../../public/logo-dark.svg'

class Sider extends PureComponent {
  themeChangeCallback (color) {
    document.getElementById('sider').style.backgroundColor = color;
  }
  render() {
    const {
      menus,
      theme,
      isMobile,
      collapsed,
      onThemeChange,
      onCollapseChange,
    } = this.props

    return (
      <Layout.Sider
        width={240}
        theme={theme}
        breakpoint="lg"
        trigger={null}
        onBreakpoint={!isMobile && onCollapseChange}
        className={styles.sider}
      >
        <div className={styles.brand}>
          <div className={styles.logo}>
            {theme === 'light' ? <img alt="logo" src={logo} /> : <img alt="logo" src={logoDark} />}
          </div>
        </div>

        <div className={styles.menuContainer}>
          <ScrollBar
            options={{
              // Disabled horizontal scrolling, https://github.com/utatti/perfect-scrollbar#options
              suppressScrollX: true,
            }}
          >
            <SiderMenu
              menus={menus}
              theme={theme}
              isMobile={isMobile}
              collapsed={collapsed}
              onCollapseChange={onCollapseChange}
            />
          </ScrollBar>
        </div>
        {!collapsed && (
          <div className={theme === 'light' ? styles.switchTheme : styles.switchDarkTheme}>
            <img src={sun} className={styles.sun}/>
            <Switch
              onChange={onThemeChange.bind(
                this,
                theme === 'dark' ? 'light' : 'dark'
              )}
              defaultChecked={theme === 'dark'}
            />
            <img src={moon} className={styles.moon}/>
          </div>
        )}
      </Layout.Sider>

    )
  }
}

Sider.propTypes = {
  menus: PropTypes.array,
  theme: PropTypes.string,
  isMobile: PropTypes.bool,
  collapsed: PropTypes.bool,
  onThemeChange: PropTypes.func,
  onCollapseChange: PropTypes.func,
}

export default Sider
