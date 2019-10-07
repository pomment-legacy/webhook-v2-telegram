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
 * @property {string} indexFile
 */

const TelegramBot = require('node-telegram-bot-api');
const log4js = require('log4js');
const http = require('http');
const axios = require('axios');
const Relation = require('./relation');
const setProxy = require('./proxy');
const renderTemplate = require('./render-template');

/**
 * @param {DaemonProps} props
 */
function daemon(props) {
    const relation = new Relation(props.token, props.indexFile);
    const logger = log4js.getLogger('PommentTelegram');
    logger.level = process.env.NODE_ENV === 'development' ? 'debug' : 'info';
    if (!props.allowedChatID) {
        logger.fatal('You did not specify an allowed chat ID.');
        process.exit(1);
    }

    const options = { polling: false };
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
        relation.set(result.message_id, data.url, data.content.id);
    };

    const handleEvent = async (res, data) => {
        try {
            const finalData = JSON.parse(data);
            switch (finalData.event) {
                case 'new_comment': {
                    if (!finalData.content.byAdmin) {
                        newComment(finalData);
                    }
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

    bot.onText(/\/help/, (msg) => {
        if (msg.chat.id !== props.allowedChatID) {
            return;
        }
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, renderTemplate('help'));
    });

    bot.onText(/\/delete/, async (msg) => {
        if (msg.chat.id !== props.allowedChatID) {
            return;
        }
        const data = relation.get(msg.message_id);
        if (typeof data === 'undefined') {
            await bot.sendMessage(props.allowedChatID, renderTemplate('delete-bad'));
        } else {
            try {
                const process = await bot.sendMessage(props.allowedChatID, renderTemplate('delete-progress'), {
                    parse_mode: 'HTML',
                    disable_web_page_preview: true,
                    reply_to_message_id: msg.message_id,
                });
                await axios.default.post(`${props.pommentAPIServer}/v2/manage/delete`, {
                    token: props.pommentAPIKey,
                    url: data.url,
                    id: data.id,
                });
                bot.editMessageText(renderTemplate('delete-success'), {
                    chat_id: props.allowedChatID,
                    message_id: process.message_id,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true,
                    reply_to_message_id: msg.message_id,
                });
            } catch (e) {
                logger.error(`Pomment Webhook connection error!\n${e}`);
            }
        }
    });

    bot.on('message', async (msg) => {
        if (msg.chat.id === props.allowedChatID) {
            if (msg.text[0] === '/') {
                return;
            }
            if (typeof msg.reply_to_message !== 'undefined') {
                const data = relation.get(msg.reply_to_message.message_id);
                if (typeof data === 'undefined') {
                    await bot.sendMessage(props.allowedChatID, renderTemplate('reply-bad'));
                } else {
                    try {
                        const process = await bot.sendMessage(props.allowedChatID, renderTemplate('reply-progress'), {
                            parse_mode: 'HTML',
                            disable_web_page_preview: true,
                            reply_to_message_id: msg.message_id,
                        });
                        await axios.default.post(`${props.pommentAPIServer}/v2/manage/submit`, {
                            token: props.pommentAPIKey,
                            url: data.url,
                            parent: data.id,
                            content: msg.text,
                            receiveEmail: false,
                        });
                        bot.editMessageText(renderTemplate('reply-success', {
                            url: data.url,
                        }), {
                            chat_id: props.allowedChatID,
                            message_id: process.message_id,
                            parse_mode: 'HTML',
                            disable_web_page_preview: true,
                            reply_to_message_id: msg.message_id,
                        });
                    } catch (e) {
                        logger.error(`Pomment Webhook connection error!\n${e}`);
                    }
                }
            }
        }
    });

    // webhook receiver for Pomment
    const pommentWH = props.webhookReceiver.pomment;
    http.createServer((req, res) => {
        logger.info(`[Pomment] Requested ${req.url}`);
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
    }).listen(pommentWH.port, '127.0.0.1');
    logger.info(`Pomment webhook server running at http://127.0.0.1:${pommentWH.port}`);

    // webhook receiver for Telegram
    const telegramWH = props.webhookReceiver.telegram;
    http.createServer((req, res) => {
        logger.info(`[Telegram] Requested ${req.url}`);
        if (req.url === `/${telegramWH.name}`) {
            let data = '';
            req.on('data', (e) => {
                data += e;
            });
            req.on('end', () => {
                bot.processUpdate(JSON.parse(data));
                res.writeHead(200);
                res.end();
            });
            return;
        }
        res.writeHead(404);
        res.end();
    }).listen(telegramWH.port, '127.0.0.1');
    logger.info(`Telegram webhook server running at http://127.0.0.1:${pommentWH.port}`);
}

module.exports = daemon;
