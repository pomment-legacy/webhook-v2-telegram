const fs = require('fs-extra');
const path = require('path');
const escapeHTML = require('./escape');

function replace(a, b, c) {
    return a.split(b).join(c);
}

function renderTemplate(template, strings = {}) {
    let tpl = fs.readFileSync(path.resolve(__dirname, `../assets/template/${template}.html`), { encoding: 'utf8' });
    const entry = Object.entries(strings);
    for (let i = 0; i < entry.length; i += 1) {
        tpl = replace(tpl, `{{${entry[i][0]}}}`, escapeHTML(entry[i][1]));
    }
    return tpl;
}

module.exports = renderTemplate;
