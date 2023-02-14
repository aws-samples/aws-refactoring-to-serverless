const { SQSClient, ReceiveMessageCommand,DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const sqsClient = new SQSClient()

exports.handler = async function (event, context) {

    try {

        // SDK call to receive messages from queue
        var params = {
            QueueUrl: process.env.QUEUE_URL,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 5
        };

        const receivedMessages = await sqsClient.send(new ReceiveMessageCommand(params));

        console.log(JSON.stringify(receivedMessages));

        if (receivedMessages.Messages) {
            // SDK call to delete messages from queue
            var deleteParams = {
                QueueUrl: process.env.QUEUE_URL,
                ReceiptHandle: receivedMessages.Messages[0].ReceiptHandle
            };
            const deletedMessages = await sqsClient.send(new DeleteMessageCommand(deleteParams));
            console.info('Delete messages return:', JSON.stringify(deletedMessages));

            // return message 
            const messages = receivedMessages.Messages.map(record => {
                return record.Body;
            })
            console.info('Received messages:', messages);
            return {
                status: 'SUCCEEDED',
                message: messages
            }
        } else {
            console.info('No messages received');
            return {
                status: 'RETRY',
            }
        }
    } catch (error) {
        console.error('Execution failed');
        return {
            status: 'FAILED',
        }
    }
};