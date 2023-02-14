const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const sqsClient = new SQSClient()

exports.handler = async (event) => {
    var response = {
        action: 'build_pizza',
        type: 'Cheese'
      };
    
    const params = {
        QueueUrl: process.env.QUEUE_URL,
        MessageBody: JSON.stringify(response)
    };

    await sqsClient.send(new SendMessageCommand(params));

    return {response};
}