const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const lambda = new LambdaClient();

exports.handler = async function (event, context) {
    try {
        // Add a ramdom order id 
        event['OrderId'] = Math.floor(Math.random() * 101);
        // Prepare invokation params 
        var params = {
            FunctionName: process.env.FUNCTION_NAME, // Get the desstination function from the Lambda env variables
            InvocationType: 'Event',
            Payload: JSON.stringify(event),
        };
        const command = new InvokeCommand(params);
        await lambda.send(command);
        return event; 
    } catch {
        throw new Error('Failure'), 'Could not invoke the destination Lambda function in code.';
    }
    
};