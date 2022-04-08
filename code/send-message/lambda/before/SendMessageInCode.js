const aws = require('aws-sdk');
const sqs = new aws.SQS();

exports.handler = async (event) => {
    
    //some business logic

    //Lastly, send message to the queue for post processing
    const params = {
        QueueUrl: process.env.QUEUE_URL,
        MessageBody: 'Hello World'
    };

    await sqs.sendMessage(params).promise();

    //return response
    return {};
}