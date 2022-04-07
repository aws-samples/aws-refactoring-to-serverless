//Notice that the filtering message logic has been removed.
exports.handler = async (event) => {

    //some business logic.
    console.log("Business logic executed")

    
   return { 
       statusCode: 201, 
       body: 'Event was consumed' 
    };
    
}