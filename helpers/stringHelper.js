// these characters cause problems for the front end when present in copy text
// therefore we sanatise them
exports.cleanString = function(str) {
    if (!str) {
        return; // leave it undefined
    }
    str = str.replace(/\\n/g, '<br>');
    str = str.replace(/"/g, "&#39;");

    return str;
};