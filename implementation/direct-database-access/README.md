# Execute read operations directly in DynamoDB using Step Functions integrations
This project is the CDK implementation of the [Direct Database Access](https://serverlessland.com/refactoring-serverless/direct-database-access) serverless refactoring. It shows how AWS Step Functions can read from DynamoDB directly without the need for a separate Lambda function. The refactoring simplifies the implementation by removing the Lambda function.


## How it works
Use a Step Functions State Machine to invoke the DynamoGetItem integration using CDK to retrieve an existing Pizza Order. This will execute the read operation in DynamoDB without the need of having a Lambda for the invocation.

The CDK code deploys 2 versions of this State Machine:
- `StateMachineOriginal`: Here the State Machine invokes a Lambda function, which in turn executes the read operation in DynamoDB.
- `StateMachineRefactored`: Here the State Machine uses the `DynamoGetItem` integration to execute the read operation directly in DynamoDB, making the implementation simple, removing unnecessary resources and lowering cost.

---
## Deploy the infrastructure

To build this app, navigate to the `implementation/direct-database-access` folder. Then run the following:

```bash
npm install -g aws-cdk
npm install
```

This will install the necessary CDK, dependencies, build your TypeScript files and CloudFormation template.

Next, deploy the 2 Stacks to your AWS Account.
``` 
cdk deploy --all
```


## Testing it out

1. First, lets create a new Pizza Order in DynamoDB:
    - Go to the AWS Console and then to Step Functions
    - Click on the `StateMachineCreateOrder` State Machine
    - Click the Start Execution button, keep the default values in the dialog and click the Start Execution button again

2. Next, lets retrieve the orderId value for the newly created Pizza Order from the command line (you can also use the console):
 ``` 
aws dynamodb scan --table-name OrdersTable
``` 

3. Now, lets test the original State Machine using the orderId you retrieved in the previous step. This version invokes a Lambda that executes the read operation in DynamoDB:
    - Go to the AWS Console and then to Step Functions
    - Click on the `StateMachineOriginal` State Machine
    - Click the Start Execution button and enter this input: `{"orderId": "[REPLACE WITH YOUR ORDER ID]"}`
    - After a few seconds you should be able to see the Pizza Order details in State Machine output details

4. Lastly, lets test the refactored State Machine using the same orderId. This version uses the DynamoGetItem integration to execute the read operation in DynamoDB without the need of using a Lambda function:
    - Go to the AWS Console and then to Step Functions
    - Click on the StateMachineRefactored State Machine
    - Click the Start Execution button and enter this input: `{"orderId": "[REPLACE WITH YOUR ORDER ID]"}`
    - After a few seconds you should be able to see the Pizza Order details in State Machine output details

*Note*: Since the refactored version executes the read operation directly in DynamoDB, it will return the results faster.

## Cleanup

Don't forget to delete the resources when you are finished.

```
cdk destroy --all
```