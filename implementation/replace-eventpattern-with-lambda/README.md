# Replace Amazon Event Bridge Event Patterns with Lambda filter

This project is the CDK implementation of ['Replace Amazon Event Bridge Event Patterns with Lambda filter'](https://serverlessland.com/refactoring-serverless/replace-eventpattern-with-lambda) pattern. It shows how can you use Lambda  in CDK to filter and route messages to target service(s) to process the event instead of Amazon EventBridge's event pattern matching when complex filtering logic or data manipulation may be required before forwarding the events to the target service(s).

## How it works

The provided example mimics an e-commerce application where Event Bridge is used as destination of user review messages. In our example we would like to route based on product rating, number of historic purchased items.

Example JSON event message:

``` Json
{
    "source": "ecommerce.application",
    "detail-type": "user.review",
    "detail": {
      "productId": "12345",
      "rating": 4.5,
      "reviewText": "Great product!",
      "reviewer": {
        "userId": "67890",
        "email": "bob.buyer@example.com",
        "signupDate": "2023-04-01T00:00:00Z",
        "purchaseHistory": [
          {
            "orderId": "10001",
            "orderDate": "2023-04-01T02:30:00Z",
            "items": [{"productId": "12345", "quantity": 1}]
          },
          {
            "orderId": "10002",
            "orderDate": "2023-07-01T02:30:00Z",
            "items": [{"productId": "12981920", "quantity": 2}]
          },
          {
            "orderId": "10003",
            "orderDate": "2023-08-01T02:30:00Z",
            "items": [{"productId": "55667788", "quantity": 3}]
          }
        ]
      }
    }
}
```

The provided code will deploy the following two stacks:

* OriginalReplaceEventpatternWithLambdaStack
* RefactoredReplaceEventpatternWithLambdaStack

Both stack deploy two lambda functions: [Original|Refactored]EventDestinationFunction1 and [Original|Refactored]EventDestinationFunction2.

OriginalReplaceEventpatternWithLambdaStack in addition deploys two Event Bridge Rules Patterns:

``` typescript
    const eventPatternFilterFunc1: events.EventPattern = {
      source: ['ecommerce.application'],
      detailType: ['user.review'],
      detail: {
        rating: [
          {
            numeric: ['>=', 4.5],
          },
        ],
      },
    };

    const eventPatternFilterFunc2: events.EventPattern = {
      source: ['ecommerce.application'],
      detailType: ['user.review'],
      detail: {
        rating: [
          {
            numeric: ['<', 2],
          },
        ],
      },
    };
```

RefactoredReplaceEventpatternWithLambdaStack deploys a simple event pattern and a lambda function `EventFilterFunction` that executes complex filtering and routing.

Event Pattern:

``` typescript
const eventPatternPass: events.EventPattern = {
      source: ['ecommerce.application'],
      detailType: ['user.review'],
    };
```

Filter logic in the lambda function:

``` Python
def process_review_event(event):
    rating = event['detail']['rating']
    purchase_history = event['detail']['reviewer']['purchaseHistory']
    total_items_purchased = sum(item['quantity'] for order in purchase_history for item in order['items'])

    if rating >= 4.5 and total_items_purchased <= 10:
        lambda_client.invoke(FunctionName=LAMBDA_DEST_FUNCTION_1, Payload=json.dumps(event))
        logging.info(f"rating >= 4.5 and total_items_purchased({total_items_purchased}) <= 10 -> invoking {LAMBDA_DEST_FUNCTION_1}")
    elif rating < 2 and total_items_purchased > 10:
        lambda_client.invoke(FunctionName=LAMBDA_DEST_FUNCTION_2, Payload=json.dumps(event))
        logging.info(f"rating < 2 and total_items_purchased({total_items_purchased}) > 10 -> invoking {LAMBDA_DEST_FUNCTION_2}")
```

## Deploy the infrastructure

To build this app, navigate to `implementation/replace-eventpattern-with-lambda` folder. Then run the following:

```bash
npm install -g aws-cdk
npm install
npm run build
```

This will install the necessary CDK, dependencies, build your TypeScript files and CloudFormation template.

Next, deploy the 2 Stacks to your AWS Account.

``` bash
cdk deploy --all
```

## Testing it out

- First lets send a message to the `default` event bus executing the following command:

``` bash
aws events put-events --entries file://example_event.json
```

You should see the following:

``` Json
{
    "FailedEntryCount": 0,
    "Entries": [
        {
            "EventId": "fdb55454-114c-3642-6a55-fb960ba0dcbf"
        }
    ]
}
```

## Verify

``` bash
aws logs describe-log-groups --query 'logGroups[?ends_with(logGroupName, `ScatterGatherWithSNSStack-refactorlambdaaggregator-nfXGleA7rZsh`)].logGroupName' --output text
```

Use the log group name from the previous command to get the logs of the aggregator function and filter by "quotes". Please replace your log group name in the following command.

``` bash
aws logs tail /aws/lambda/ScatterGatherWithSNSStack-refactorlambdaaggregator-nfXGleA7rZsh  --filter-pattern "quotes" 
```

The two stacks provisioned the following Lambda functions:

* ```EventFilterFunction```
* ```RefactoredEventDestinationFunction1```
* ```RefactoredEventDestinationFunction2```
* ```OriginalEventDestinationFunction2```
* ```OriginalEventDestinationFunction1```

Let's inspect the logs of the ```EventFilterFunction```, ```RefactoredEventDestinationFunction1``` and ```OriginalEventDestinationFunction1```.

For each of the use cases we will first get the lates log stream of the and then get the log events using the aws cli.

EventFilterFunction:

``` Bash
stream_name=$(aws logs describe-log-streams --log-group-name /aws/lambda/EventFilterFunction --order-by LastEventTime --descending --limit 1 | jq -r '.logStreams[0].logStreamName')
aws logs get-log-events --log-group-name /aws/lambda/EventFilterFunction  --log-stream-name $stream_name | jq '.events | map(select(.message | contains("[INFO]")))'
```

You should see:

``` Json
[
  {
    "timestamp": 1691161162130,
    "message": "[INFO]\t2023-08-04T14:59:22.129Z\tf5366ef3-2a31-4b49-8218-e1b4c4abfc7a\trating >= 4.5 and total_items_purchased(6) <= 10 -> invoking RefactoredEventDestinationFunction1\n",
    "ingestionTime": 1691161162889
  }
]
```

RefactoredEventDestinationFunction1 and OriginalEventDestinationFunction1:

``` Bash
stream_name=$(aws logs describe-log-streams --log-group-name /aws/lambda/OriginalEventDestinationFunction1 --order-by LastEventTime --descending --limit 1 | jq -r '.logStreams[0].logStreamName')
aws logs get-log-events --log-group-name /aws/lambda/OriginalEventDestinationFunction1  --log-stream-name $stream_name | jq '.events | map(select(.message | contains("[INFO]")))'
```

and

``` Bash
stream_name=$(aws logs describe-log-streams --log-group-name /aws/lambda/RefactoredEventDestinationFunction1 --order-by LastEventTime --descending --limit 1 | jq -r '.logStreams[0].logStreamName')
aws logs get-log-events --log-group-name /aws/lambda/RefactoredEventDestinationFunction1  --log-stream-name $stream_name | jq '.events | map(select(.message | contains("[INFO]")))'
```

You should get:

``` Json
[
  {
    "timestamp": 1691158134746,
    "message": "[INFO]\t2023-08-04T14:08:54.746Z\t0115f9ac-f35a-4b33-91cd-7d9aebb401ff\tHello from Rule1 handler function\n",
    "ingestionTime": 1691158137055
  },
  {
    "timestamp": 1691158134746,
    "message": "[INFO]\t2023-08-04T14:08:54.746Z\t0115f9ac-f35a-4b33-91cd-7d9aebb401ff\tReceived Event: {\"version\": \"0\", \"id\": \"e15f7622-3c9d-1186-a3a3-736f84aeb58b\", \"detail-type\": \"user.review\", \"source\": \"ecommerce.application\", \"account\": \"446084752553\", \"time\": \"2023-08-04T14:08:53Z\", \"region\": \"us-east-1\", \"resources\": [], \"detail\": {\"productId\": \"12345\", \"rating\": 4.5, \"reviewText\": \"Great product!\", \"reviewer\": {\"userId\": \"67890\", \"email\": \"example@example.com\", \"signupDate\": \"2023-04-01T00:00:00Z\", \"purchaseHistory\": [{\"orderId\": \"10001\", \"orderDate\": \"2023-04-01T02:30:00Z\", \"items\": [{\"productId\": \"12345\", \"quantity\": 1}]}]}}}\n",
    "ingestionTime": 1691158137055
  }
]
```

## Cleanup

``` bash
cdk destroy --all
```
