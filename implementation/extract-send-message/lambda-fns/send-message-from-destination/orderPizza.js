//Note: There is no mention of SQS within the code, yet it is integrated with SQS using lambda destinations
exports.handler = async (event) =>  {
  
  console.log('Order Received')

  response = {
    action: 'build_pizza',
    type: 'Cheese'
  };

  //Note: The response is passed in 'Body' of SQS Message
  return response;
};  