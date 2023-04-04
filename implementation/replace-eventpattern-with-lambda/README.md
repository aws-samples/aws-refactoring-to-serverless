# Replace Event Pattern with Lambda

This project is the CDK implementation of ['Replace Event Pattern with Lambda'](https://serverlessland.com/refactoring-serverless/replace-eventpattern-with-lambda) pattern. It shows how can you use Lambda  in CDK to filter and route messages to target service(s) to process the event instead of Amazon EventBridge's event pattern matching when complex filtering logic or data manipulation may be required before forwarding the events to the target service(s).

## How it works

The provided example mimics an e-commerce application where Event bBridge is used as destination of user review messages.

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
        "email": "example@example.com",
        "signupDate": "2023-04-01T00:00:00Z",
        "purchaseHistory": [
          {
            "orderId": "10001",
            "orderDate": "2023-04-01T02:30:00Z",
            "items": [{"productId": "12345", "quantity": 1}]
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
    review_date = parse(event['detail']['reviewer']['signupDate'])
    days_since_signup = (datetime.now(timezone.utc) - review_date).days
    purchase_history = event['detail']['reviewer']['purchaseHistory']
    total_items_purchased = sum(item['quantity'] for order in purchase_history for item in order['items'])

    if rating >= 4.5 and days_since_signup <= 30:
        lambda_client.invoke(FunctionName=LAMBDA_DEST_FUNCTION_1, Payload=json.dumps(event))
    elif rating < 2 and total_items_purchased > 10:
        lambda_client.invoke(FunctionName=LAMBDA_DEST_FUNCTION_2, Payload=json.dumps(event))
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

Login to your AWS console and navigate to Lambda. You should see 5 functions:

* EventFilterFunction
* RefactoredEventDestinationFunction1
* RefactoredEventDestinationFunction2
* OriginalEventDestinationFunction2
* OriginalEventDestinationFunction1

Inspect the logs of each function. You should see the following:
EventFilterFunction:
```
[INFO]	2023-04-04T14:07:24.735Z	e3d0952a-b266-4e3e-bc31-2b5dd0a3ac50	rating >= 4.5 and days_since_signup <= 30 -> invoking RefactoredEventDestinationFunction1
```

RefactoredEventDestinationFunction1 and OriginalEventDestinationFunction1:
```
[INFO]	2023-04-04T14:07:24.731Z	cab9c22c-09d1-4e30-b683-2b3e5ffc3b18	Received Event: {
    "version": "0",
    "id": "178a9cec-0596-5b6f-b37b-b33c32f12183",
    "detail-type": "user.review",
    "source": "ecommerce.application",
    "account": "446084752553",
    "time": "2023-04-04T14:07:23Z",
    "region": "us-east-1",
    "resources": [],
    "detail": {
        "productId": "12345",
        "rating": 4.5,
        "reviewText": "Great product!",
        "reviewer": {
            "userId": "67890",
            "email": "example@example.com",
            "signupDate": "2023-04-01T00:00:00Z",
            "purchaseHistory": [
                {
                    "orderId": "10001",
                    "orderDate": "2023-04-01T02:30:00Z",
                    "items": [
                        {
                            "productId": "12345",
                            "quantity": 1
                        }
                    ]
                }
            ]
        }
    }
}
```

## Cleanup

``` bash
cdk destroy --all
```
