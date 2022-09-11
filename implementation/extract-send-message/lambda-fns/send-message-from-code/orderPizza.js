const aws = require('aws-sdk');
const sqs = new aws.SQS();

exports.handler = async (event) => {
    console.log('Order Received')

    response = {
        action: 'build_pizza',
        type: 'Cheese'
      };
    
    const params = {
        QueueUrl: process.env.QUEUE_URL,
        MessageBody: JSON.stringify(response)
    };

    await sqs.sendMessage(params).promise();

    return {response};
}