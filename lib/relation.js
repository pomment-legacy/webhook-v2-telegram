const home = require('os').homedir();
const fs = require('fs-extra');
const path = require('path');

const dataName = '.pomment_telegram';

function escapeFileName(str) {
    return encodeURIComponent(str).replace(/\*/g, '%2A');
}

class Relation {
    constructor(token) {
        this.dir = path.resolve(home, dataName);
        this.listPath = path.resolve(this.dir, `${escapeFileName(token)}.json`);
        this.list = {};
        fs.mkdirpSync(this.dir);
        if (fs.existsSync(this.listPath)) {
            this.list = fs.readJSONSync(this.listPath, { encoding: 'utf8' });
        }
    }

    get(messageID) {
        return this.list[String(messageID)];
    }

    set(messageID, url, id) {
        this.list[String(messageID)] = {
            url, id,
        };
        fs.writeJSONSync(this.listPath, this.list, { encoding: 'utf8' });
    }
}

module.exports = Relation;
