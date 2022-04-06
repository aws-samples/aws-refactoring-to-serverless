/*
* Note: After successfully executing the business logic, this lambda has code to publish event to EventBridge
*/
const AWS = require('aws-sdk')
const eventbridge = new AWS.EventBridge()

exports.handler = async (events) => {
    console.log(JSON.stringify(events));

    //some business logic
    if(!events.domain) throw new Error("Domain was not passed in payload!!")


    //on success, publish event to EventBridge
    const params = {
      Entries: [ 
        {
          EventBusName: process.env.EVENTBUS_NAME,
          Source: 'lambda',
          DetailType: 'Lambda Invocation Completed - Publish event for Post Processing',
          Detail: JSON.stringify({ // Main event body. We will use 'domain' property to filter in EventBridge
                requestPayload: {
                  domain: events.domain,
                  name: events.name
                }
          })
        }
      ]
    };

    await eventbridge.putEvents(params).promise();
  
    return {
      statusCode: 200
    };
  };