const url = require('url');
const https = require('https');
const SocksProxyAgent = require('socks-proxy-agent');

// SOCKS proxy to connect to
const proxy = process.env.socks_proxy || 'socks5://127.0.0.1:1080';
console.log('using proxy server %j', proxy);

// HTTP endpoint for the proxy to connect to
const endpoint = process.argv[2] || 'https://www.google.com/';
console.log('attempting to GET %j', endpoint);
const opts = url.parse(endpoint);

// create an instance of the `SocksProxyAgent` class with the proxy server information
// NOTE: the `true` second argument! Means to use TLS encryption on the socket
const agent = new SocksProxyAgent(proxy, true);
opts.agent = agent;

https.get(opts, (res) => {
    console.log('"response" event!', res.headers);
    res.pipe(process.stdout);
});
