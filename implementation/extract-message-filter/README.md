# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template


aws logs create-log-group --log-group-name /aws/events/eventbridge-logs-refactored
aws events put-rule --name eventbridge-logs --event-pattern "{\"account\":[\"291701893262\"]}" --event-bus-name RecordsEventBusRefactored
aws events put-targets --rule eventbridge-logs --targets "Id"="1","Arn"="arn:aws:logs:us-east-1:291701893262:log-group:/aws/events/eventbridge-logs-refactored" --event-bus-name RecordsEventBusRefactored
