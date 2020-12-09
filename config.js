export const HADES_CONFIG = {
  networks: {
    dev: {
      provider: 'ws://localhost:8545',
      chainId: 0x539,
      orchestratorAddress: '0xfe57175001DAA3BacB220dBe30036241E20F1FA0',
      etherscan: 'etherscan.io',
    },
    test: {
      provider: 'ws://139.180.193.123:8545',
      chainId: 0x539,
      orchestratorAddress: '0x458369Be2dEF2ad7b1eEEA42699f084436B22176',
      etherscan: 'etherscan.io',
    },
    kovan: {
      provider: 'https://kovan.infura.io/v3/d3f8f9c2141b4561b6c7f23a34466d7c',
      chainId: 42,
      orchestratorAddress: '0x297344B27D52abAe0f30AFE947ddAd60d425F40d',
      etherscan: 'kovan.etherscan.io',
    },
    ropsten: {
      provider: 'https://ropsten.infura.io/v3/d3f8f9c2141b4561b6c7f23a34466d7c',
      chainId: 3,
      orchestratorAddress: '0x297344B27D52abAe0f30AFE947ddAd60d425F40d',
      etherscan: 'ropsten.etherscan.io',
    },
    live: {
      provider: 'ws://localhost:8545',
      chainId: 1,
      orchestratorAddress: '0x297344B27D52abAe0f30AFE947ddAd60d425F40d',
      etherscan: 'etherscan.io',
    },
  },
}