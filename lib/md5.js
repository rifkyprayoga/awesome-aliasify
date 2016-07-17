/**
 * Created by tommyZZM.OSX on 16/7/18.
 */
"use strict";
const crypto = require("crypto")

module.exports = function (input,length,start=0) {
    let hash = crypto.createHash('md5');
    let updater = update(hash);
    let $input = input;
    let $start = start;
    let $length = length;

    if (Array.isArray($input)) {
        $input.map(input=>input.toString()).forEach(updater);
    } else {
        updater($input.toString());
    }

    let digested = hash.digest('hex');
    if ($start>digested.length || typeof $start!=="number") {
        $start = 0;
    }

    return digested.substring($start,$length);

    function update($hash) {
        return buf => {
            let inputEncoding = typeof buf === 'string' ? 'utf8' : void 0;
            return $hash.update(buf, inputEncoding)
        }
    }
}