const aws = require('aws-sdk');
const sqs = new aws.SQS();

exports.handler = async (event, context) => {

    for (const record of event.Records) {
        const messageBody = JSON.parse(record.body);

        try {
            // process order and return pizza  
            const output = {
                "name": "lambda pizza baking service",
                "message": "pizza is ready - enjoy!",
                "order": messageBody.input.order
            }

            const params = {
                QueueUrl: process.env.QUEUE_URL,
                MessageBody: JSON.stringify(output)
            };
        
            await sqs.sendMessage(params).promise();

            // return the result
            // return JSON.stringify(output);

        } catch (error) {
            console.error(error.message);
        }
    }
};
