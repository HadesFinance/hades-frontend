// https://umijs.org/config/
import { resolve } from 'path'
const fs = require('fs')
const path = require('path')
const lessToJs = require('less-vars-to-js')
const isDevelopment = process.env.NODE_ENV === 'development'

// how to speed compile: https://umijs.org/guide/boost-compile-speed
export default {
  // IMPORTANT! change next line to yours or delete. And hide in dev
  publicPath: isDevelopment ? '/' : './',
  alias: {
    api: resolve(__dirname, './src/services/'),
    components: resolve(__dirname, './src/components'),
    config: resolve(__dirname, './src/utils/config'),
    themes: resolve(__dirname, './src/themes'),
    utils: resolve(__dirname, './src/utils'),
  },
  antd: {},
  // a lower cost way to genereate sourcemap, default is cheap-module-source-map, could save 60% time in dev hotload
  devtool: 'eval',
  dva: { immer: true },
  dynamicImport: {
    loading: 'components/Loader/Loader',
  },
  // extraBabelPresets: ['@lingui/babel-preset-react'],
  extraBabelPlugins: [
    [
      'import',
      {
        libraryName: 'lodash',
        libraryDirectory: '',
        camel2DashComponentName: false,
      },
      'lodash',
    ],
    [
      'import',
      {
        libraryName: '@ant-design/icons',
        libraryDirectory: 'es/icons',
        camel2DashComponentName: false,
      },
      'ant-design-icons',
    ],
  ],
  hash: true,
  ignoreMomentLocale: true,
  // umi3 comple node_modules by default, could be disable
  nodeModulesTransform: {
    type: 'none',
    exclude: [],
  },
  // Webpack Configuration
  proxy: {
    '/api/v1/weather': {
      target: 'https://api.seniverse.com/',
      changeOrigin: true,
      pathRewrite: { '^/api/v1/weather': '/v3/weather' },
    },
  },
  targets: { ie: 9 },
  // Theme for antd
  // https://ant.design/docs/react/customize-theme
  // theme: lessToJs(
  //   fs.readFileSync(path.join(__dirname, './src/themes/default.less'), 'utf8')
  // ),
  chainWebpack: function (config, { webpack }) {
    config.merge({
      optimization: {
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 30000,
          minChunks: 3,
          automaticNameDelimiter: '.',
          cacheGroups: {
            react: {
              name: 'react',
              priority: 20,
              test: /[\\/]node_modules[\\/](react|react-dom|react-dom-router)[\\/]/,
            },
            antd: {
              name: 'antd',
              priority: 20,
              test: /[\\/]node_modules[\\/](antd|@ant-design\/icons)[\\/]/,
            },
            async: {
              chunks: 'async',
              minChunks: 2,
              name: 'async',
              maxInitialRequests: 1,
              minSize: 0,
              priority: 5,
              reuseExistingChunk: true,
            },
            commons: {
                // 其余同步加载包
                chunks: 'all',
                minChunks: 2,
                name: 'commons',
                priority: 8,
            },
          },
        },
      },
    })
  },
}
