exports.handler = async function(event, context) {

    if (event.Sender) {
        return event;
    } else {
        return new Error('Failure'), 'Event does not contain a sender';
    }
};