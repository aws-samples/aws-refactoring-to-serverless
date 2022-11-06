exports.handler = async function (event, context) {
    try {
        // Add a ramdom order id 
        event['OrderId'] = Math.floor(Math.random() * 101);
        return event;
    } catch {
        return new Error('Failure'), 'Could not invoke the destination Lambda function onSuccess.';
    }
}