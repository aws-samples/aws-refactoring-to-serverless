# Convert Choreography to Orchestration
This project is the CDK implementation of ['Convert Orchestration to Choreography'](https://serverlessland.com/refactoring-serverless/choreography-to-orchestration) pattern. It shows how you can convert a distributed message flow Choreography architecture to a central workflow Orchestration architecture. 

## How it works: 
The use case is for an application that place an order for a product (Order Placement Workflow). Customer sends a request to place an order for a product. The application completes a series of steps required to complete an order and ship the product to customer. The code will deploy 2 CloudFormation stacks ChoreographyStack and OrchestrationStack. In ChoreographyStack the services coordinate among themselves, the refactored OrchestrationStack uses a central orchestrator to manage and coordinate the interactions. 

***
## Choreography: 

The flow starts with customer submitting a place order request to the API Gateway REST API. Placing order is a lengthy process so there is no immediate response. The API accepts the place order request and returns a success or failed response. 

API gateway then sends the request to a Lambda function, which processes the payment and uses Amazon DynamoDB table as temporary storage for payment data. After that, the request is published to a 'Ship Order' SNS topic. Using Publish-subscribe model another Lambda function will register to the 'Ship Order' SNS topic. This function reads the data from DynamoDB table to verify if payment was processed successfully and then ships an order. Throws an error is payment is not processed successfully. After that, the record in DynamoDB table is updated and the request will be forwarded to 'Update Reward' SNS topic. 

The UpdateReward Lambda function is subscribed to the SNS topic. This function reads data from DynamoDB table and verifies if the order is shipped. If order is shipped successfully then the DynamoDB table is updated with the reward data, if not an error is thrown. 

Customer requests the order details using the 'get Order' REST API. The API reads the response from the DynamoDB table, formats the data to JSON for the customer. All the components in this architecture can operate independently and asynchronously without needing a central coordinator

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

The stack outputs the RESTAPIendpoint. Please note the value, we need them to test our application. 

## Testing:

Submit a place order request to the API Gateway REST API with the Stock ID using the curl command: 

```bash
curl --location --request POST '{RESTAPIendpoint}/prod/placeOrder' \
--header 'Content-Type: text/plain' \
--data-raw '{
    "product_id" : (Product ID, should be an integer)}
}'

````

Example request: 

```bash
curl --location --request POST 'https://98zhk8yq1m.execute-api.us-west-1.amazonaws.com/prod/placeOrder' \
--header 'Content-Type: text/plain' \
--data-raw '{
    "product_id" : 20
}'

```

This will give a 200 success response.

Now run the get Order API using the curl command:

```bash
curl --request GET '{RESTAPIendpoint}/prod/getOrder/{Product ID}'
```
Example request: 

```bash
curl --request GET 'https://1234abc5.execute-api.us-east-1.amazonaws.com/prod/getOrder/10'
```

Response will include a JSON object with details about the order, sample JSON response:

```bash
{
    "Product Id": 10,
    "Payment has been processed": true,
    "Order has been shipped": true,
    "Reward was updated": true
}
```

Cleanup:

```bash
cdk destroy ChoreographyStack
```
***

## Orchestration:

A step function models the work flow as a state machine, coordinates the interactions between components and completes the workflow. The state machine invokes the Lambda function and send the output to the next state. It then uses a Choice state to add conditional logic to either move to next steps or to an error state. 

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
Run the below command using AWS CLI, to start a state machine execution

```bash
aws stepfunctions start-execution --state-machine-arn {StateMAchineARN}  --input "$(echo '{"product_id": "112"}')"
```

The response will contain executionArn. Run the below command using the executionArn

```bash
aws stepfunctions describe-execution --execution-arn {executionArn} | grep -w output | sed 's/\\//g'
```

The response looks similar to: 

```bash
"output": "{"Product ID":"112","Order has been shipped":true,"Reward was updated":true,"Payment has been processed":true}",

```
## Cleanup:
cdk destroy OrchestrationStack