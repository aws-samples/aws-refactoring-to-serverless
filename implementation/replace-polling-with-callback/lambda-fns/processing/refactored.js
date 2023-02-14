const { SFNClient, SendTaskSuccessCommand } = require("@aws-sdk/client-sfn");
const client = new SFNClient();

exports.handler = async function (event, context) {

    for (const record of event.Records) {
        const messageBody = JSON.parse(record.body);

        try {
            // process order and return pizza  
            const output = {
                "name": "lambda pizza baking service",
                "message": "pizza is ready - enjoy!",
                "order": messageBody.input.order
            }

            const params = {
                output: JSON.stringify(output),
                taskToken: messageBody.taskToken
            };

            //directly send task message to stepfunction
            const command = new SendTaskSuccessCommand(params);
            await client.send(command);
            
        } catch (error) {
            throw new console.error(error.message);
        }
    }
};
