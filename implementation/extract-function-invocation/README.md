# Extract AWS Lambda Function Invocation using Lambda Destinations
This project is the CDK implementation of ['Extract Function Invocation'](https://serverlessland.com/refactoring-serverless/extract-function-invocation) serverless refactoring. It shows how can you Lambda Destination in CDK to send message to AWS Lambda and make the application topology explicit.

## How it works
The Invocation Lambda Function adds an order id to the incoming pizza order event and then invokes a second Lambda Function for further processing.

The code will deploy 2 versions of the Invocation Lambda:
- invocationFnOriginal: Here the Lambda invokes the second Lambda from code.
- invocationFnRefactored: Only contains application logic. Function invocation sending is extracted from Lambda and [wired in CDK](./lib/extract-function-invocation-refactored.ts).


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

## Test the functionality using the AWS CLI 

First, let's test the lambda that has logic in code:
``` 
aws lambda invoke \
--function-name invocationFnOriginal \
--invocation-type Event \
--cli-binary-format raw-in-base64-out \
--payload '{ "Order": "Pizza cheese original from code" }' \
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
--function-name invocationFnRefactored \
--invocation-type Event \
--cli-binary-format raw-in-base64-out \
--payload '{ "Order": "Pizza funghi refactored from CDK" }' \
output.json
 ``` 
You should see:
``` 
{
    "StatusCode": 202
}
``` 

*Note*: 
- Lambda base64 encoded payloads. Hence, `--cli-binary-format raw-in-base64-out` to send it as clear text.
- We used `--invocation-type Event`  above because Lambda Destination only supports Asynchronous invocation.

## Verify

1. Login to your AWS console and navigate to `CloudFormation`
2. Select the stack and navigate to `Resources`
3. Select the destination function 
4. On the Function page select `Monitor` and click on `View logs in CloudWatch` and select the recent Log Stream
5. Verify that you can find both invocations in the log Messages: 

Original example:
```
Destination received event with id: 17 and order: Pizza cheese original from code
```


Refactored example:
```
Destination received event with id: 94 and order: Pizza funghi refactored from CDK
```

## Clean up

1. Remove your CDK stack:
```
cdk destroy
```

2. Select `y` to delete the stack:
`Are you sure you want to delete: STACK_NAME (y/n)?`
