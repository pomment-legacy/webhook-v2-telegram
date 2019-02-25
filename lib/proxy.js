/* eslint-disable no-param-reassign */

const SocksAgent = require('socks5-https-client/lib/Agent');
const { URL } = require('url');

function setProxy({ props, options, logger }) {
    if (props.proxy || props.proxy.enabled) {
        const url = new URL(props.proxy.address);
        switch (url.protocol) {
            case 'socks5:': {
                logger.info(`Using proxy ${props.proxy.address}`);
                options.request = {
                    agentClass: SocksAgent,
                    agentOptions: {
                        socksHost: url.hostname,
                        socksPort: url.port,
                    },
                };
                break;
            }
            default: {
                logger.warn('Only socks5 proxy is supported. The proxy field is ignored.');
                break;
            }
        }
    }
}

module.exports = setProxy;
