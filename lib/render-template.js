const fs = require('fs-extra');
const path = require('path');
const escapeHTML = require('./escape');

const tpls = fs.readJSONSync(path.resolve(__dirname, '../assets/template/data.json'), { encoding: 'utf8' });

function replace(a, b, c) {
    return a.split(b).join(c);
}

function renderTemplate(template, strings = {}) {
    let tpl = tpls[template];
    const entry = Object.entries(strings);
    for (let i = 0; i < entry.length; i += 1) {
        tpl = replace(tpl, `{{${entry[i][0]}}}`, escapeHTML(entry[i][1]));
    }
    return tpl;
}

module.exports = renderTemplate;
