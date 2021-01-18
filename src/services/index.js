import request from 'utils/request'
import api from './api'
import store from 'store'
const network = store.get('network');
const apiPrefix = network.indexServer;
//import { apiPrefix } from 'utils/config'


const gen = params => {
  let url = apiPrefix + params
  let method = 'GET'

  const paramsArray = params.split(' ')
  if (paramsArray.length === 2) {
    method = paramsArray[0]
    url = apiPrefix + paramsArray[1]
  }

  return function(data) {
    return request({
      url,
      data,
      method,
    })
  }
}

const APIFunction = {}
for (const key in api) {
  APIFunction[key] = gen(api[key])
}

APIFunction.queryWeather = params => {
  params.key = 'i7sau1babuzwhycn'
  return request({
    url: `${apiPrefix}/weather/now.json`,
    data: params,
  })
}

export default APIFunction
