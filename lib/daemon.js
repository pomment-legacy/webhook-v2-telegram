/**
 * @typedef Receiver
 * @property {string} name
 * @property {string} host
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
const http = require('http');
const setProxy = require('./proxy');
const renderTemplate = require('./render-template');

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

    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        if (chatId === props.allowedChatID) {
            bot.sendMessage(chatId, 'Worked!');
        }
    });
    const pommentWH = props.webhookReceiver.pomment;
    http.createServer((req, res) => {
        console.log(req.url);
        if (req.url === `/${pommentWH.name}`) {
            let data = '';
            req.on('data', (e) => {
                data += e;
            });
            req.on('end', () => {
                const finalData = JSON.parse(data);
                switch (finalData.event) {
                    case 'new_comment': {
                        const msg = renderTemplate('new-comment', {
                            url: finalData.url,
                            title: finalData.title,
                            name: finalData.content.name,
                            website: finalData.content.website,
                            content: finalData.content.content,
                        });
                        bot.sendMessage(props.allowedChatID, msg, {
                            parse_mode: 'HTML',
                            disable_web_page_preview: true,
                        });
                        break;
                    }
                    default: {
                        break;
                    }
                }
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('received');
            });
            return;
        }
        res.writeHead(404);
        res.end();
    }).listen(pommentWH.port, pommentWH.host);
    logger.info(`Pomment webhook server running at http://${pommentWH.host}:${pommentWH.port}`);
}

module.exports = daemon;
