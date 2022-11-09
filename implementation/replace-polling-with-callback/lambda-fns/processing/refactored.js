console.log('Loading function');
const aws = require('aws-sdk');

exports.handler = (event, context, callback) => {
    const stepfunctions = new aws.StepFunctions();

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

            stepfunctions.sendTaskSuccess(params, (err, data) => {
                if (err) {
                    console.error(err.message);
                    callback(err.message);
                    return;
                }
                console.log(data);
                callback(null);
            });
        } catch (error) {
            throw new console.error(error.message);
        }
    }
};
