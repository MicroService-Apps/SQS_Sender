# SQS_Sender

## usage
Run the micro service by using running script with service name

./run.sh [service name]


The input message is wrote in /input_message/inputMessage.json

## file structure
/input_message/inputMessage.json define sent message

/sqs_sender/sqsSender.js handle sending and receiving

/config/ store all queue urls and corresponding operations
