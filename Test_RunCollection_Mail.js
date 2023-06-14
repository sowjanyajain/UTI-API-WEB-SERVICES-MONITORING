const newman = require('newman'); // require newman in your project
const nodemailer = require('nodemailer');
const yargs = require('yargs');

let errorCount = 0;
let notOkCount = 0;
let requestName;

let params = yargs.argv;

let sCollectionURL;
let iCount;
let sEnvironmentJson;
let iRequestTimeout;
let emailAddress;
let gitUrl;
let gitRunid;
let gmailPassword;

try {
    console.log(process.argv);
    sCollectionURL = params.curl;
    iCount = parseInt(params.icnt) || 1;
    sEnvironmentJson = params.ejson;
    iRequestTimeout = parseInt(params.timeout);
    emailAddress = params.emails.replace(' ', '').split(',');
    gitUrl = params.gurl;
    gitRunid = params.grunid;

    console.log('Iteration count: ' + iCount);
    console.log('Environment JSON: ' + sEnvironmentJson);
    console.log('Collection URL: ' + sCollectionURL);
    console.log('Emails: ' + emailAddress);
    
} catch (error) {
    console.log('Error reading the git action variables:' + error.message);
}

async function runNewman() {
    // call newman.run to pass `options` object and wait for callback
    newman.run({
        collection: sCollectionURL,
        reporters: ['htmlextra'],  // cli, json, junit, progress and emojitrain
        iterationCount: iCount,
        environment: sEnvironmentJson,
        timeoutRequest: iRequestTimeout,
        reporter: {
            htmlextra: {
                browserTitle: "Execution report",
                title: "API/WebService Execution Report",
                timezone: "Asia/Kolkata",
                //displayProgressBar: true
            }
        }
    }).on('start', function (err, args) { // on start of run, log to console
        console.log('------- Start collection run...');
    }).on('assertion', (error, summary) => {
        if (error || summary.error) {
        //if(requestName != summary.item.name){
            errorCount++;
        //}
            requestName = summary.item.name;
            //console.log('Assert error for Request: ' + requestName);  
            //console.error(error);
        }
    }).on('request', function (err, args) {
        if (err) {
          console.error(err);
          return;
        }
        if(args.response.code > 299){
            notOkCount++;
        }
        // Log request details
        console.log(`Request: ${args.request.method} ${args.request.url} ${args.response.code}`);
    }).on('done', function (err, summary) {
        if (err || summary.error) {
            console.error('collection run encountered an error.');
            throw err;
        }
        else {
            console.log('------- Collection run completed! --------');
            console.log('No of assert failed: '+ errorCount);
            let newStr = gitUrl.replace('git://', 'https://');
            newStr = newStr.replace('.git', '/actions/runs/');
            let fullurl = newStr.concat(gitRunid);
            console.log(fullurl);
            mailFun(errorCount, fullurl, notOkCount)
            .catch(e => console.log(e));
        }
    });


} //runNewman

async function mailFun(ifailedCnt, runJobURL, iStatusCnt) {
  // Create a transporter using Gmail SMTP settings
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'perfqapm@gmail.com',
      pass: 'kbvvfrqnrkhlhpva'
    }
  });

  const html = `
    <h1>API WebServices Monitoring Solution Run failed!</h1>
    <h2>No. of Request with failed respone status: ${iStatusCnt}.</h2>
    <h2>No. of Tests(Assertions) failed: ${ifailedCnt}.</h2>
    <h3>Link: ${runJobURL}</h3>
    `;

  const info = await transporter.sendMail({
    from: 'Monitoring Service <perfqapm@gmail.com>',
    to: emailAddress,
    subject: '[API WebServices Monitoring Solution] Run failed!',
    //text: 'This is a test email sent from Node.js using Nodemailer',
    html: html,
  })

  console.log('Email sent: ' + info.response);
  console.log('Email accepted: ' + info.accepted);

} // mailFun

runNewman();