# Send messages via EventBridge Pipes
This project is the CDK implementation of ['Send Message via Pipes'](https://github.com/aws-samples/aws-refactoring-to-serverless/blob/main/patterns/send-message-via-pipes.md) pattern. This patterns shows how you can reduce your application code and improve consistency by utilizing EventBridge Pipes.


## How it works
The purpose of the application is to persist an order in DB and then send order details for further processing.

The code will deploy 2 versions of this application:
- process-order-original: The lambda code in this version saves an item into a DynamoDB table and sends a message to an event bus.
- process-order-refactored: Message sending is removed from the Lambda code in this version. DynamoDB stream and EventBridge pipes take care of that.

---
## Deploy the applications

To build this app, navigate to `implementation/send-message-via-pipes` folder. Then run the following:

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

## Testing

- Before testing the applications, let's create additional EventBridge rules to send events to CloudWatch so we can review them (replace <account-id>):

```
# Original stack

# Create a CloudWatch Log group
aws logs create-log-group --log-group-name /aws/events/eventbridge-logs-original
# Create a rule
aws events put-rule --name eventbridge-logs --event-pattern "{\"account\":[\"<account-id>\"]}" --event-bus-name OrdersEventBusOriginal
# Configure the rule to send to CloudWatch
aws events put-targets --rule eventbridge-logs --targets "Id"="1","Arn"="arn:aws:logs:us-east-1:<account-id>:log-group:/aws/events/eventbridge-logs-original" --event-bus-name OrdersEventBusOriginal

# Same for the refactored stack
aws logs create-log-group --log-group-name /aws/events/eventbridge-logs-refactored
aws events put-rule --name eventbridge-logs --event-pattern "{\"account\":[\"<account-id>\"]}" --event-bus-name OrdersEventBusRefactored
aws events put-targets --rule eventbridge-logs --targets "Id"="1","Arn"="arn:aws:logs:us-east-1:<account-id>:log-group:/aws/events/eventbridge-logs-refactored" --event-bus-name OrdersEventBusRefactored

```  

- Now, let's invoke the original lambda function that sends a message from the code:
``` 
aws lambda invoke \
    --function-name ProcessOrderOriginal \
    --invocation-type Event \
    --payload '{ "orderId": "1", "productId": "1" }' \
    --cli-binary-format raw-in-base64-out \
    response.json

```
You should see StatusCode:202

- Next, let's invoke the refactored lambda 
 ``` 
aws lambda invoke \
    --function-name ProcessOrderRefactored \
    --invocation-type Event \
    --payload '{ "orderId": "1", "productId": "1" }' \
    --cli-binary-format raw-in-base64-out \
    response.json
``` 

You should see StatusCode:202     

## Verify

Login to your AWS console and navigate to Amazon CloudWatch. You should see 2 log groups:

- /aws/events/eventbridge-logs-original
- /aws/events/eventbridge-logs-refactored

Each log group should have a log stream displaying a message that event bus received, similar to the following:
```
{
    "version": "0",
    "id": "8db2791e-eab2-efd5-18aa-cf6ca95a3894",
    "detail-type": "order-details",
    "source": "my-source",
    "account": "<redacted>",
    "time": "2023-03-01T19:11:30Z",
    "region": "us-east-1",
    "resources": [],
    "detail": {
        "orderId": "1",
        "productId": "1"
    }
}
```

## Cleanup

```
aws logs delete-log-group --log-group-name /aws/events/eventbridge-logs-original
aws logs delete-log-group --log-group-name /aws/events/eventbridge-logs-refactored

aws events remove-targets --rule eventbridge-logs --event-bus-name OrdersEventBusOriginal --ids "1"
aws events delete-rule --name eventbridge-logs --event-bus-name OrdersEventBusOriginal

aws events remove-targets --rule eventbridge-logs --event-bus-name OrdersEventBusRefactored --ids "1"
aws events delete-rule --name eventbridge-logs --event-bus-name OrdersEventBusRefactored

cdk destroy --all
```

