export const HADES_CONFIG = {
  networks: {
    dev: {
      provider: 'ws://localhost:8545',
      chainId: 0x539,
      orchestratorAddress: '0x0c55c34555C65d963E9C6363A5ed77AFDac32a34',
      etherscan: 'etherscan.io',
      indexServer: 'http://158.247.223.174:4000',
    },
    test: {
      provider: 'ws://139.180.193.123:8545',
      chainId: 0x539,
      orchestratorAddress: '0x0c55c34555C65d963E9C6363A5ed77AFDac32a34',
      etherscan: 'etherscan.io',
      indexServer: 'http://158.247.223.174:4000',
    },
    kovan: {
      provider: 'https://kovan.infura.io/v3/d3f8f9c2141b4561b6c7f23a34466d7c',
      chainId: 42,
      orchestratorAddress: '0x0c55c34555C65d963E9C6363A5ed77AFDac32a34',
      etherscan: 'kovan.etherscan.io',
      indexServer: 'http://158.247.223.174:4000',
    },
    ropsten: {
      provider: 'https://ropsten.infura.io/v3/d3f8f9c2141b4561b6c7f23a34466d7c',
      chainId: 3,
      orchestratorAddress: '0x0c55c34555C65d963E9C6363A5ed77AFDac32a34',
      etherscan: 'ropsten.etherscan.io',
      indexServer: 'http://158.247.223.174:4000',
    },
    live: {
      provider: 'ws://localhost:8545',
      chainId: 1,
      orchestratorAddress: '0x0c55c34555C65d963E9C6363A5ed77AFDac32a34',
      etherscan: 'etherscan.io',
      indexServer: 'http://158.247.223.174:4000',
    },
  },
}
