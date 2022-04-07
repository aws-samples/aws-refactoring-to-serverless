
exports.handler = async (event) => {
    const input = event.detail;
    
    //filtering out message
    if (!input.name || input.location != 'NYC') {
        console.log("Message was filtered out !!!!")
        return
    } 

    //some business logic
    console.log("Business logic executed")
    
   return { 
       statusCode: 201, 
       body: 'Event was consumed' 
    };
    
}