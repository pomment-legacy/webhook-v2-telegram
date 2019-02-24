/**
 * @typedef Receiver
 * @property {string} name
 * @property {number} port
 */
/**
 * @typedef WebhookReceiver
 * @property {Receiver} telegram
 * @property {Receiver} pomment
 */
/**
 * @typedef Proxy
 * @property {boolean} enabled
 * @property {string} address
 */
/**
 * @typedef DaemonProps
 * @property {string} token
 * @property {WebhookReceiver} webhookReceiver
 * @property {Proxy} proxy
 * @property {string} pommentAPIKey
 */

const Telegraf = require('telegraf');
const SocksAgent = require('socks5-https-client/lib/Agent');
const SocksProxyAgent = require('socks-proxy-agent');
const { URL } = require('url');
const log4js = require('log4js');

/**
 * @param {DaemonProps} props
 */
function daemon(props) {
    const logger = log4js.getLogger('PommentTelegram');
    logger.level = 'debug';
    const options = {};
    if (props.proxy || props.proxy.enabled) {
        const url = new URL(props.proxy.address);
        switch (url.protocol) {
            case 'socks5:': {
                logger.info(`Using proxy ${props.proxy.address}`);
                options.agent = new SocksAgent({
                    socksHost: url.hostname,
                    socksPort: url.port,
                });
                break;
            }
            default: {
                logger.warn('Only socks5 proxy is supported. The proxy field is ignored.');
                break;
            }
        }
    }
    const bot = new Telegraf(props.token, options);
    bot.start((ctx) => {
        console.log(ctx);
        return ctx.reply('Welcome');
    });
    bot.on('text', ctx => ctx.reply('Hello World'));
    bot.launch();
}

module.exports = daemon;
