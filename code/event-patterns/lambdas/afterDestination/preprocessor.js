/*
* Note: There is no code here for publishing event to EventBridge
*/
exports.handler = async (events) => {
    console.log(JSON.stringify(events));
  
   //some business logic.
   if(!events.domain) throw new Error("Domain was not passed in payload!!")
  
   //on success, simply return
    return {
      statusCode: 200
    };
  };