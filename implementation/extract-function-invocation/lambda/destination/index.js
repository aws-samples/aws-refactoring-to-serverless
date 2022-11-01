exports.handler = async function(event, context) {
    console.log('Destination received event from:', event.Sender);
};