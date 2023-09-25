# Convert Choreography to Orchestration
This project is the CDK implementation of ['Convert Orchestration to Choreography'](https://serverlessland.com/refactoring-serverless/choreography-to-orchestration) pattern. It shows how you can convert a distributed message flow Choreography architecture to a central workflow Orchestration architecture. 

## How it works: 
The use case is for an  application that provides recommendations to buy or sell a stock(Stock Recommendation Engine). Customer sends a recommendation request for a stock. The application broadcasts the recommendation request to multiple resources and re-aggregate the responses back into a single quote and is sent to the customer. 

***
## Choreography: 

The flow starts with client submitting a recommendation quote request to the API Gateway REST API. Generating quotes is a lengthy process so there is no immediate response. The API accepts the recommendation request and returns a success or failed response. 

API Gateway then publishes the details into as SNS topic. SNS broadcasts the request to all potential recommendation resources. The resources use Publish-subscribe messaging model and will register (or subscribe) to the SNS topic. 

The resources receives the message, runs their recommendation logic and submits their quote. All the quotes from resources are sent to Amazon SQS queue. The aggregator component then consumes the individual responses from the queue and uses an integration pattern, Stock ID to match incoming messages to the right Stock. The aggregator responsibility is simple to persist the details of each incoming quote into an Amazon DynamoDB table. 

Client requests the quote from using the Query REST API. The API reads the responses from the DynamoDB table, converts the data to JSON for the customer. All the components in this architecture can operate independently and asynchronously without needing a central coordinator.

## Deploy the application:
To build this app, navigate to implementation/choreography-to-orchestration folder. Then run the following:

```bash
npm install -g aws-cdk
npm install
```

This will install the necessary CDK, dependencies, build your TypeScript files and CloudFormation template.

Next, deploy the choreography Stack to your AWS Account.

```bash
cdk bootstrap
cdk deploy ChoreographyStack
```

The stack outputs the RESTAPIendpoint and SNSTopicARN. Please note the values, we need them to test our application. 

## Testing:

Submit a recommendation quote request to the API Gateway REST API with the Stock ID using the curl command: 

```bash
curl --request POST '{RESTAPIendpoint}/submit?message=%7B%22stock-id%22:{Stock ID(should be an Integer, for example 3}%7D&topic={SNSTopic ARN}'
    ```
Example request: 

```bash
curl --location --request POST 'https://1234abc5.execute-api.us-east-1.amazonaws.com/prod/submit?message=%7B%22stock-id%22:3%7D&topic=arn:aws:sns:us-east-1:123456789123:StockRecommendation'

```

This will give a 200 success response.

Now run the query quotes API using the curl command:

```bash
curl --request GET '{RESTAPIendpoint}/query/{Stock ID}'
```
Example request: 

```bash
https://1234abc5.execute-api.us-east-1.amazonaws.com/prod/query/3
```

Response will include a JSON object with quotes from all the Recommendation resources, sample JSON response:

```bash
{
    "Quotes": [
        "Stock Id": 3,
        "Recommendation": buy,
        "Quote by": RecommendationResource1
,
        "Stock Id": 3,
        "Recommendation": buy,
        "Quote by": RecommendationResource2
,
        "Stock Id": 3,
        "Recommendation": buy,
        "Quote by": RecommendationResource3
    ]
}
```

Cleanup:

```bash
cdk destroy ChoreographyStack
```
***

## Orchestration:
A step function models the work flow as a state machine, coordinates the interactions between components and completes the workflow. The state machine uses Parallel state and adds separate branches to the recommendation resources. Each branch executes concurrently and waits until all resources respond  (or reach a terminal state). 

## Deploy the application:
To build this app, navigate to implementation/choreography-to-orchestration folder. Then run the following:

```bash
npm install -g aws-cdk
npm install
```

This will install the necessary CDK, dependencies, build your TypeScript files and CloudFormation template.

Next, deploy the choreography Stack to your AWS Account.

```bash
cdk bootstrap
cdk deploy OrchestrationStack
```
The stack outputs the StateMAchineARN. Please note the values, we need them to test our application. 

## Testing:
Run the below command using AWS CLI, to start a stste machine execution

```bash
aws stepfunctions start-execution --state-machine-arn {StateMAchineARN}  --input "$(echo '{"stock-id": 10}' | jq -R . )"
```

The response will contain executionArn. Run the below command using the executionArn

```bash
aws stepfunctions describe-execution --execution-arn {executionArn} | grep output  |sed 's/\\//g'
```

The response looks similar to: 

```bash
{
  "Quotes": [
    {
      "stock-id": 10,
      "quote": "sell",
      "from": "RecommendationResource1"
    },
    {
      "stock-id": 10,
      "quote": "sell",
      "from": "RecommendationResource2"
    },
    {
      "stock-id": 10,
      "quote": "sell",
      "from": "RecommendationResource3"
    }
  ]
}
```
## Cleanup:
cdk destroy OrchestrationStack