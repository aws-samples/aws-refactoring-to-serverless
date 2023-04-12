// handler.js
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

exports.handler = async (event, context) => {
  console.log(JSON.stringify(event))
};
