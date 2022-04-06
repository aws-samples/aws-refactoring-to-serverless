const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();


exports.handler = async (event) => {
    console.log(event.detail);

    const userInput = event.detail.requestPayload; //input received to "PreProcessing" Lambda

    // some business logic to presist data in DB
    const params = {
        TableName: process.env.TABLE_NAME,
        Item: {
            id:AWS.util.uuid.v4(),
            domain: userInput.domain,
            name: userInput.name
            }
      };

    try {
        await db.put(params).promise();
        return { statusCode: 201, body: 'Student Added' };
    } catch (dbError) {
        return { statusCode: 500, body: dbError.message };
    }
}