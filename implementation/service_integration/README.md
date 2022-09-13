# Replace AWS Lambda by AWS Step Functions SDK integrations
This project is the CDK implementation of ['service-integration'](../../patterns/extract_send_message.md) pattern. This pattern shows how we replace AWS Lambda by AWS Step Functions SDK integrations to call any of 200+ AWS services directly from your state machine. 

## How it works
We will deploy 2 AWS Step Functions that will detect labels in an image with confidence score > 80.
- first Step Function calls AWS Lambda which then calls AWS Rekognition Service *detectLabel* API
- second *Refactored*  Step Function replaces Lambda to call *detectLabel* directly using [SDK Service Integration](https://docs.aws.amazon.com/step-functions/latest/dg/supported-services-awssdk.html)

---
## Deploy the infrastructure

To build this app, navigate to ```implementation/service_integation``` folder. Then run the below  command in your Terminal Window:

```bash
npm install -g aws-cdk
npm install
npm run build
```

This will install the necessary CDK, project dependencies, build the TypeScript files and CloudFormation template.


Now, lets deploy / redeploy this Stack to your AWS Account.
``` 
cdk deploy
```

Copy value for `ArnForLambdaIntegration` and `ArnForServiceIntegration` from CDK deploy output.
We will be using this to execute the step function in section below.

---
## Testing it out
1. Run the following AWS CLI command to start the Step Functions . Note, you must edit the {ArnForLambdaIntegration} placeholder with the ARN of the deployed Step Functions workflow. This is provided in the stack outputs.

```aws stepfunctions start-execution --name "test" --state-machine-arn {ArnForLambdaIntegration}```  

Output:
```
{
    "executionArn": "arn:aws:states:us-west-2:593184816077:execution:workflowWithLambdaED2D644B-4n0OwyNtNA4p:test",
    "startDate": "2022-09-12T12:36:44.112000-07:00"
}
```
Replace the {executionARN} placeholder using executionArn from above. Now run the below cli command to get the status of the execution.

```aws stepfunctions describe-execution --execution-arn {executionARN}```  

Ouput:
You should see 4 labels in JSON:
*Person, Human, Clothing, and Apparel* 

2. Now repeat the steps using ```ArnForServiceIntegration``` to execute the StepFunction that uses Step Fuction SDK Service Integration 

```aws stepfunctions start-execution --name "test" --state-machine-arn {ArnForServiceIntegration}```  
```aws stepfunctions describe-execution --execution-arn {executionARN}```

Ouput:
You should see same 4 labels detected in JSON:
Person, Human, Clothing, and Apparel


--- 
Hence confirming that refactoring did not alter the behavior.

---
## Cleanup
```cdk destroy```