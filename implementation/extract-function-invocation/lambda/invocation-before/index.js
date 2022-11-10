const aws = require('aws-sdk');
const lambda = new aws.Lambda();

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
        // Invoke the destination function 
        await lambda.invoke(params).promise(); // Invokes the destination function in code
        return { }; 
    } catch {
        throw new Error('Failure'), 'Could not invoke the destination Lambda function in code.';
    }
    
};