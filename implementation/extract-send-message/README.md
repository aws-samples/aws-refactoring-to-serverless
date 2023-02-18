# Extract  AWS Lambda by AWS Step Functions SDK integrations
This project is the CDK implementation of ['Extract Send Message'](../../patterns/extract_send_message.md) pattern. This patterns shows how can you Lambda Destination in CDK to send message to SQS and make the application topology explicit.


## How it works
BakePizza Lambda processes incoming request and then sends message to SQS for downstream processing.

The code will deploy 2 versions of this Lambda:
- bakePizza_original: Here the Lambda publishes message to SQS from code.
- bakePizza_refactored: Only contains application logic. Message sending is extracted from Lambda and wired in CDK

---
## Deploy the infrastructure


To build this app, navigate to `implementation/extract-send-message` folder. Then run the following:

```bash
npm install -g aws-cdk
npm install
npm run build
```

This will install the necessary CDK, dependencies, build your TypeScript files and CloudFormation template.

Next, deploy the 2 Stacks to your AWS Account.
``` 
cdk deploy --all
```


## Testing it out

- First, lets invoke the lambda that sends message from code:
``` 
aws lambda invoke --function-name bakePizza_original --invocation-type Event --payload '{}' output.json
```
You should see StatusCode:202

- Next, lets test the lambda which is refactored to uses Lambda Destination
 ``` 
aws lambda invoke --function-name bakePizza_refactored --invocation-type Event --payload '{}' output.json
``` 

You should see StatusCode:202     

*Note*: We used `--invocation-type Event`  above because Lambda Destination only supports Asynchronous invocation.


## Verify

Login to your AWS console and navigate to Amazon SQS.  
You should see 2 Queues.
- PizzaQueue
- PizzaQueue_Refactored

Inspect the message on each Queue using 'Poll Messages'. You should see a message send from respective Lambda function.
{"action":"build_pizza","type":"Cheese"}

## Cleanup

```
cdk destroy --all
```

## To-DO 
 
Add Unit Test