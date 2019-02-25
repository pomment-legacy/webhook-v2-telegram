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
 * @property {number} allowedChatID
 */

const TelegramBot = require('node-telegram-bot-api');
const log4js = require('log4js');
const setProxy = require('./proxy');

/**
 * @param {DaemonProps} props
 */
function daemon(props) {
    const logger = log4js.getLogger('PommentTelegram');
    logger.level = 'debug';
    if (!props.allowedChatID) {
        logger.fatal('You did not specify an allowed chat ID.');
        process.exit(1);
    }

    const options = { polling: true };
    setProxy({ props, options, logger });
    const bot = new TelegramBot(props.token, options);

    bot.onText(/\/start/, (msg, match) => {
        const chatId = msg.chat.id;
        console.log(msg);
        console.log(match);
        bot.sendMessage(chatId, 'Worked!');
    });
}

module.exports = daemon;
