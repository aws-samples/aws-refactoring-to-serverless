//Note: There is no mention of SQS within the code, yet it is integrated with SQS using lambda destinations
exports.handler = async (event) =>  {
 
  var response = {
    action: 'build_pizza',
    type: 'Cheese'
  };

  return response;
};  