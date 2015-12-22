var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var URL = require('../config/url');
var fs = require('fs');

var serviceName = process.argv[2];
var queUrl = URL.getInQueUrl(serviceName);
var resQueUrl = URL.getResQueUrl(serviceName);

if(queUrl == null) {
    console.log("Service doesn't exist");
    return;
}

AWS.config.update({
    "region": "us-east-1"
});

var sqs = new AWS.SQS();
var corrId = uuid();
var msg = JSON.parse(fs.readFileSync('./input_message/inputMessage.json', 'utf8'));
msg.Req.Header.CID = corrId;

console.log("******** Sent Message ************************************************* ");
console.log(JSON.stringify(msg, null, 2));
console.log("*********************************************************************** \n");

var sqsParams = {
    MessageBody: JSON.stringify(msg),
    QueueUrl: queUrl
};

sqs.sendMessage(sqsParams, function(err, data) {
    if (err) {
        console.log('ERR', err);
    }

    responseQueListener();
});

// get message from response queue
function responseQueListener() {
    var receiveMessageParams = {
        QueueUrl: resQueUrl,
        MaxNumberOfMessages: 1,
        VisibilityTimeout: 30, // seconds - how long we want a lock on this job
        WaitTimeSeconds: 20 // seconds - how long should we wait for a message?
    };

    sqs.receiveMessage(receiveMessageParams, receiveMessageCallback);
}

// receive message callback function
function receiveMessageCallback(err, data) {
    if (data && data.Messages && data.Messages.length > 0) {
        for (var i=0; i < data.Messages.length; i++) {
            // handle message
            var message = JSON.parse(data['Messages'][0]['Body']);
            var receivedCorrId = message['Res']['Header']['CID'];

            if(receivedCorrId == corrId) {
                message.Res.Body = JSON.parse(message.Res.Body);

                console.log("******** Received Message ********************************************* ");
                console.log(JSON.stringify(message, null, 2));
                console.log("*********************************************************************** \n");
            }

            // Delete the message when we've successfully processed it
            var deleteMessageParams = {
                QueueUrl: resQueUrl,
                ReceiptHandle: data.Messages[i].ReceiptHandle
            };

            sqs.deleteMessage(deleteMessageParams, deleteMessageCallback);
        }
    }
}

function deleteMessageCallback(err, data) {
    //console.log("deleted message");
    //console.log(data);
}