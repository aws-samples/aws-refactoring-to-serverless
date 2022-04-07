## Requirement

AWS CLI already configured with Administrator permission

## Build

To build this app, you need to be in this example's root folder. Then run the following:

```bash
npm install -g aws-cdk
npm install
npm run build
```

This will install the necessary CDK, this example's dependencies, and then build your TypeScript files and your CloudFormation template.

## Deploy

Run below to deploy / redeploy this Stack to your AWS Account.
``` 
cdk deploy
```


## Test the functionality

Test the consumer with code for filtering.  
- Valid Message
```
aws events put-events  --cli-binary-format raw-in-base64-out --entries '[{"EventBusName": "EventBus","Source": "some-source", "DetailType": "Broadcast", "Detail": "{\"name\": \"Jane Doe\", \"location\": \"NYC\"}"}]'
```
- Invalid Message
```
aws events put-events  --cli-binary-format raw-in-base64-out --entries '[{"EventBusName": "EventBus","Source": "some-source", "DetailType": "Broadcast", "Detail": "{\"name\": \"Jane Doe\", \"location\": \"Phoenix\"}"}]'
```
---
Test the consumer using Content Based Filtering with Event Bridge Event Pattern.  
a. Valid Message 
```
aws events put-events  --cli-binary-format raw-in-base64-out --entries '[{"EventBusName": "MessageFilteringBus","Source": "some-source", "DetailType": "Broadcast", "Detail": "{\"name\": \"Jane Doe\", \"location\": \"NYC\"}"}]'
```
b. Invalid Message
```
aws events put-events  --cli-binary-format raw-in-base64-out --entries '[{"EventBusName": "MessageFilteringBus","Source": "some-source", "DetailType": "Broadcast", "Detail": "{\"name\": \"Jane Doe\", \"location\": \"NYC\"}"}]'
```
