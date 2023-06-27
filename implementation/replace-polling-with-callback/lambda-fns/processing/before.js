const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const sqsClient = new SQSClient()

exports.handler = async (event, context) => {

    for (const record of event.Records) {
        const messageBody = JSON.parse(record.body);

        try {
            // process order 
            const output = {
                "name": "lambda pizza baking service",
                "message": "pizza is ready - enjoy!",
                "order": messageBody.input.order
            }

            const params = {
                QueueUrl: process.env.QUEUE_URL,
                MessageBody: JSON.stringify(output)
            };
        
            //sends message to sqs
            await sqsClient.send(new SendMessageCommand(params));

        } catch (error) {
            console.error(error.message);
        }
    }
};
