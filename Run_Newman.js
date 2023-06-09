const newman = require('newman'); // require newman in your project

let sCollectionURL = undefined;
let iCount;
let sEnvironmentURL = '';
let iRequestTimeout;
try {
    console.log(process.argv);
    sCollectionURL = process.argv[2];
    iCount = parseInt(process.argv[3]) || 1;
    sEnvironmentURL = process.argv[4];
    iRequestTimeout = parseInt(process.argv[5]);
    if (sCollectionURL === undefined) {
        console.warn('Collection URL may not be specified');
    }
    if (iCount > 1) {
        console.log('Iteration count: ' + iCount);
    }
    console.log('Collection URL: ' + sCollectionURL);
} catch (error) {
    console.log('Error reading the git action variables:' + error.message);
}

// call newman.run to pass `options` object and wait for callback
newman.run({
    collection: sCollectionURL,
    reporters: ['htmlextra'],  // cli, json, junit, progress and emojitrain
    iterationCount: iCount,
    environment: sEnvironmentURL,
    timeoutRequest: iRequestTimeout,
    reporter: {
        htmlextra: {
            browserTitle: "Execution report",
            title: "API/Web Service Execution Report",
            timezone: "Asia/Kolkata",
            //displayProgressBar: true
        }
    }
}, function (err) {
    if (err) { throw err; }
    console.log('collection run complete!');
});
