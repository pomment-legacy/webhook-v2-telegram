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
const Relation = require('./relation');
const setProxy = require('./proxy');
const renderTemplate = require('./render-template');

/**
 * @param {DaemonProps} props
 */
function daemon(props) {
    const relation = new Relation(props.token);
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

    const newComment = async (data) => {
        const msg = renderTemplate('new-comment', {
            url: data.url,
            title: data.title,
            name: data.content.name,
            website: data.content.website,
            content: data.content.content,
        });
        const result = await bot.sendMessage(props.allowedChatID, msg, {
            parse_mode: 'HTML',
            disable_web_page_preview: true,
        });
        relation.set(result.message_id, data.url, data.id);
    };

    const handleEvent = async (res, data) => {
        try {
            const finalData = JSON.parse(data);
            switch (finalData.event) {
                case 'new_comment': {
                    newComment(finalData);
                    break;
                }
                default: {
                    break;
                }
            }
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('received');
        } catch (e) {
            logger.error(e);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('error');
        }
    };

    const pommentWH = props.webhookReceiver.pomment;
    http.createServer((req, res) => {
        console.log(req.url);
        if (req.url === `/${pommentWH.name}`) {
            let data = '';
            req.on('data', (e) => {
                data += e;
            });
            req.on('end', () => {
                handleEvent(res, data);
            });
            return;
        }
        res.writeHead(404);
        res.end();
    }).listen(pommentWH.port, pommentWH.host);
    logger.info(`Pomment webhook server running at http://${pommentWH.host}:${pommentWH.port}`);
}

module.exports = daemon;
