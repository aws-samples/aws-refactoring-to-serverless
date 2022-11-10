exports.handler = async function(event, context) {
    console.log(`Destination received event with id: ${event['OrderId']} and order: ${event['Order']}`);
};