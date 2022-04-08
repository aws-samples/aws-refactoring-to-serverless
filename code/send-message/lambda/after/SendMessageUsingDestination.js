//Note: There is no mention of SQS within the code, yet it is integrated with SQS using lambda destinations
exports.handler = async (event) =>  {

    //some business logic

    //return response
    return {
        message: 'Hello World - I am refactored'
    };
};  