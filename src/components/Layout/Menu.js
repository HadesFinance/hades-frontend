import React, { PureComponent, } from 'react'
import PropTypes from 'prop-types'
import { Menu } from 'antd'
import { NavLink, withRouter } from 'umi'
import { pathToRegexp } from 'path-to-regexp'
import { arrayToTree, queryAncestors } from 'utils'
import store from 'store'
import styles from './Sider.less'

@withRouter
class SiderMenu extends PureComponent {
  state = {
    openKeys: store.get('openKeys') || [],
  }

  onOpenChange = openKeys => {
    const { menus } = this.props
    const rootSubmenuKeys = menus.filter(_ => !_.menuParentId).map(_ => _.id)

    const latestOpenKey = openKeys.find(
      key => this.state.openKeys.indexOf(key) === -1
    )

    let newOpenKeys = openKeys
    if (rootSubmenuKeys.indexOf(latestOpenKey) !== -1) {
      newOpenKeys = latestOpenKey ? [latestOpenKey] : []
    }

    this.setState({
      openKeys: newOpenKeys,
    })
    store.set('openKeys', newOpenKeys)
  }

  generateMenus(data,selectedKeys) {
    return data.map(item => {
      let isSelected = selectedKeys.filter(selected_item => selected_item === item.id).length >0 ? true :false;
      return (
        <Menu.Item key={item.id}>
          <NavLink to={item.route || '#'}>
            {isSelected ? <img alt="icon" src={item.activeIcon} className={styles.menuIcon} /> : <img alt="icon" src={item.icon} className={styles.menuIcon} />}
            {/*<img alt="icon" src={item.icon} />*/}
            <span>{item.name}</span>
          </NavLink>
        </Menu.Item>
      )
    })
  }

  render() {
    const {
      collapsed,
      theme,
      menus,
      location,
      isMobile,
      onCollapseChange,
    } = this.props

    // Generating tree-structured data for menu content.
    const menuTree = arrayToTree(menus, 'id', 'menuParentId')

    // Find a menu that matches the pathname.
    const currentMenu = menus.find(
      _ => _.route && pathToRegexp(_.route).exec(location.pathname)
    )

    // Find the key that should be selected according to the current menu.
    const selectedKeys = currentMenu
      ? queryAncestors(menus, currentMenu, 'menuParentId').map(_ => _.id)
      : []

    const menuProps = collapsed
      ? {}
      : {
        openKeys: this.state.openKeys,
      }

    return (
      <Menu
        mode="inline"
        theme={theme}
        onOpenChange={this.onOpenChange}
        selectedKeys={selectedKeys}
        defaultSelectedKeys={['1']}
        onClick={
          isMobile
            ? () => {
              onCollapseChange(true)
            }
            : undefined
        }
        {...menuProps}
      >
        {this.generateMenus(menuTree,selectedKeys)}
      </Menu>
    )
  }
}

SiderMenu.propTypes = {
  menus: PropTypes.array,
  theme: PropTypes.string,
  isMobile: PropTypes.bool,
  onCollapseChange: PropTypes.func,
}

export default SiderMenu
