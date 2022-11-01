# Description 

This stack contains two AWS Lambda functions that demonstrate before/after implementing Lambda Destinations to invoke a Lambda Destination function.

* `bin/extract-function-invocation.ts` is the entrypoint of the CDK application. 
* `lib/extract-function-invocation-stack.ts`: This is where the CDK application's main stack if defined. The stack provisions: 
    * 1 Lambda function serving as the onSuccess destination
    * 2 Lambda functions to invoke the destination function to demonstrate code before/after the refactoring
* `lambda/destination/index.js`: This is the destination function to be invoked. It receives the event and logs a message about the sender based on the event content
* `lambda/invocation-before/index.js`: This function invokes the destination in code using the AWS SDK for JavaScript
* `lambda/invocation-after/index.js`: This function invokes the destination via the onSuccess Lambda Destination configuration in CDK

## Requirements 

The [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configured with certain permissions to create those resources. 

## Build

To build this app, you need to be in this example's root folder. Then run the following:
```bash
npm install
npm run build
cdk synth
```

This will install the necessary CDK, this example's dependencies. It compiles typescript to js and emits the synthesized CloudFormation template for this stack.

## Deploy

0. Bootstrap the environment if you have not used AWS CDK in the deployment region for your account
``` 
cdk bootstrap
```

1. Run below to deploy / redeploy this Stack to your AWS Account:
``` 
cdk deploy
```

2. Select `y` to create the stack:
`Do you wish to deploy these changes (y/n)?`

3. You should see:
 ✅  FunctionInvocationStack


## Test the functionality using the AWS CLI 

First, let's test the lambda that has logic in code:
``` 
aws lambda invoke \
--function-name invocationBeforeFn \
--invocation-type Event \
--cli-binary-format raw-in-base64-out \
--payload '{ "Sender": "Invocation in Code" }' \
output.json
```
You should see: 
``` 
{
    "StatusCode": 202
}
``` 

Next, let's test the refactored lambda invocation using Lambda Destinations
 ``` 
aws lambda invoke \
--function-name invocationAfterFn \
--invocation-type Event \
--cli-binary-format raw-in-base64-out \
--payload '{ "Sender": "Invocation in CDK" }' \
output.json
 ``` 
You should see:
``` 
{
    "StatusCode": 202
}
``` 

*Note*: Lambda base64 encoded payloads. Hence, `--cli-binary-format raw-in-base64-out` to send it as clear text.

## Verify

1. Login to your AWS console and navigate to `CloudFormation`
2. Select the stack `FunctionInvocationStack` and navigate to `Resources`
3. Select the destination function holding the Physical ID `destinationFn`
4. On the Function page select `Monitor` and click on `View logs in CloudWatch` and select the recent Log Stream
5. Verify that you can find both invocations in the log Messages: 
    - `INFO Destination received event from: Invocation in Code`
    - `INFO Destination received event from: Invocation in CDK`

## Clean up

1. Remove your CDK stack:
```
cdk destroy
```

2. Select `y` to delete the stack:
`Are you sure you want to delete: FunctionInvocationStack (y/n)?`

3. You should see:
`FunctionInvocationStack: destroying...`
