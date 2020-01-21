const fs = require('fs');

const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');

const THRESHOLD_ERROR = 55; // percentage
const THRESHOLD_WARNING = 15; // percentage

function warn(fp, before, after) {
    console.warn('WARNING', _summarize(fp, before, after, THRESHOLD_WARNING));
}
function error(fp, before, after) {
    console.error('ERROR  ', _summarize(fp, before, after, THRESHOLD_ERROR));
}
function _summarize(fp, before, after, threshold) {
    const p = 100 * (1 - after / before);
    return `${fp} was ${_fmt(before)} and could be ${_fmt(after)} (${p.toFixed(
        1
    )}% smaller) which is more than ${threshold}%`;
}
function _fmt(bytes) {
    return `${(bytes / 1024).toFixed(1)}KB`;
}

(async () => {
    const files = await imagemin(['live-examples/**/*.{jpg,png}'], {
        destination: '/tmp/live-examples-images',
        plugins: [imageminJpegtran(), imageminPngquant()]
    });

    let errors = 0;
    let warnings = 0;
    for (let file of files) {
        let sizeBefore = fs.statSync(file.sourcePath)['size'];
        let sizeAfter = fs.statSync(file.destinationPath)['size'];
        let improvement = 100 * (1 - sizeAfter / sizeBefore);
        if (improvement > THRESHOLD_ERROR) {
            errors++;
            error(file.sourcePath, sizeBefore, sizeAfter);
        } else if (improvement > THRESHOLD_WARNING) {
            warnings++;
            warn(file.sourcePath, sizeBefore, sizeAfter);
        }
    }
    if (warnings) {
        console.warn(
            `${warnings} images could be improved by at least ${THRESHOLD_WARNING}%`
        );
    }
    if (errors) {
        console.warn(
            `${errors} images could be improved by at least ${THRESHOLD_ERROR}%`
        );
        process.exit(errors);
    }
})();
