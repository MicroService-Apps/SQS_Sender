var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var URL = require('../config/url');

var inName = 'FinanceInputQueue';
var resName = 'FinanceResponseQueue';
var queUrl = URL.getUrl(inName);
var resQueUrl = URL.getUrl(resName);

AWS.config.update({
    "accessKeyId": "AKIAJW66E6QSMI6DEVEQ",
    "secretAccessKey": "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",
    "region": "us-east-1"
});

var sqs = new AWS.SQS();
var corrId = uuid();

var msg = {
    Req: {
        Header: {
            OP: 'read',
            ID: 'sss',
            RQ: 'FinanceResponseQueue',
            CID: corrId
        },
        Body: {
            //name: 'xxx',
            //instructor: 'zzz'
        }
    }
};

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
                console.log(message);
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