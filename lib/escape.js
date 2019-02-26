const needEscape = /["&<>]/;

function escapeHTML(str) {
    const targetStr = String(str);
    if (!needEscape.exec(targetStr)) {
        return targetStr;
    }
    let newStr = '';
    for (let i = 0; i < targetStr.length; i += 1) {
        switch (targetStr.charCodeAt(i)) {
            case 34: // "
                newStr += '&quot;';
                break;
            case 38: // &
                newStr += '&amp;';
                break;
            case 60: // <
                newStr += '&lt;';
                break;
            case 62: // >
                newStr += '&gt;';
                break;
            default:
                newStr += targetStr[i];
        }
    }
    return newStr;
}

module.exports = escapeHTML;
