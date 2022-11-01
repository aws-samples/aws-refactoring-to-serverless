const aws = require('aws-sdk');
const lambda = new aws.Lambda();

exports.handler = async function (event, context) {

    if (event.Sender) {
        // Prepare invokation params 
        var params = {
            FunctionName: process.env.FUNCTION_NAME,
            InvocationType: 'Event',
            Payload: JSON.stringify(event),
        };
        // Invoke the destination function 
        await lambda.invoke(params).promise();
        return { params };
    } else {
        return new Error('Failure'), 'Event does not contain a sender';
    }
    
};