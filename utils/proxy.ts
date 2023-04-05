const HttpsProxyAgent = require('https-proxy-agent');

const baseFetchOptions: any = {};
if (process.env.https_proxy) {
  // const proxyUrl = new URL(process.env.https_proxy);
  baseFetchOptions.agent = new HttpsProxyAgent(process.env.https_proxy);
}

export default baseFetchOptions;
