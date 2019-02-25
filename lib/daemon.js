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

const TelegramBot = require('node-telegram-bot-api');
const SocksAgent = require('socks5-https-client/lib/Agent');
const { URL } = require('url');
const log4js = require('log4js');

/**
 * @param {DaemonProps} props
 */
function daemon(props) {
    const logger = log4js.getLogger('PommentTelegram');
    logger.level = 'debug';
    const options = { polling: true };
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
    const bot = new TelegramBot(props.token, options);

    bot.onText(/\/start/, (msg, match) => {
        const chatId = msg.chat.id;
        console.log(msg);
        console.log(match);
        bot.sendMessage(chatId, '啊啊啊啊啊啊啊啊（');
    });

    bot.onText(/\/echo (.+)/, (msg, match) => {
        const chatId = msg.chat.id;
        const resp = match[1];
        bot.sendMessage(chatId, resp);
    });

    bot.on('message', (msg, match) => {
        const chatId = msg.chat.id;
        console.log(msg);
        console.log(match);
        bot.sendMessage(chatId, 'Received your message');
    });
}

module.exports = daemon;
