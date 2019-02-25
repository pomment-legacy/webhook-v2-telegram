const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs-extra');
const path = require('path');
const log4js = require('log4js');
const argv = require('minimist')(process.argv.slice(2));
const crypto = require('crypto');
const setProxy = require('./proxy');

function tempDaemon() {
    const logger = log4js.getLogger('PommentTelegram');
    logger.level = 'debug';
    const props = fs.readJSONSync(path.resolve(process.cwd(), argv._[1]), { encoding: 'utf8' });
    const options = { polling: true };
    setProxy({ props, options, logger });
    const bot = new TelegramBot(props.token, options);
    const verifyCode = crypto.randomBytes(4).toString('hex');
    bot.onText(/\/verify (.+)/, (msg, match) => {
        const chatId = msg.chat.id;
        const resp = match[1];
        if (resp === verifyCode) {
            props.allowedChatID = chatId;
            fs.writeJSONSync(path.resolve(process.cwd(), argv._[1]), props, { encoding: 'utf8', spaces: 4 });
            logger.info(`Allowed chat ID has been set to \x1b[33m${chatId}\x1b[0m`);
            process.exit(0);
        }
    });
    logger.info(`Now, send \x1b[33m/verify ${verifyCode}\x1b[0m to the bot on the target chat.`);
}

module.exports = tempDaemon;
