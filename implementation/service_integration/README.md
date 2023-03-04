# Replace Lambda with Service Integration
This project is the CDK implementation of [Replace Lambda With Service Integration](https://serverlessland.com/refactoring-serverless/service-integration) pattern. This pattern shows how you can use AWS SDK Service Integration to call any of 200+ AWS services directly from your Step Function. 

## How it works
StepFunction does 'food quality control' to ensure that only pizzas are baked.
It uses Rekognition to scan and detect object in an image in S3 bucket. If it detects a pizza then worklow succeeds.


The code will deploy 2 versions of the StepFunction:
- FoodQualityControl-Original: It uses AWS Lambda to invoke AWS Rekognition Service to get labels from the image.
- FoodQualityControl-Refactored:  This version replaces Lambda to call *detectLabels* directly using [SDK Service Integration](https://docs.aws.amazon.com/step-functions/latest/dg/supported-services-awssdk.html)

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
cdk deploy --all
```

From the CDK Outputs, 
Copy value for `ArnForStepFunctionOrginal` and `ArnForStepFunctionRefactored`.
We will be using the ARNs to execute the Step Function in section below.

---
## Testing it out
You have 2 choices to run the step functions: 1) AWS Console 2) via AWS CLI.
To test via CLI, follow instructions below:
1. Run the following AWS CLI command to start the Step Functions . Note, you must edit the {ArnForLambdaIntegration} placeholder with the ARN of the deployed Step Functions workflow. This is provided in the stack outputs.

```aws stepfunctions start-execution --name "test" --state-machine-arn {ArnForStepFunction_Orginal}```  

Output:
```
{
    "executionArn": "arn:aws:states:us-west-2:xxx:execution:FoodQualityControl-Original:test",
    "startDate": "2022-09-12T12:36:44.112000-07:00"
}
```
Replace the {executionARN} placeholder using executionArn from above. Now run the below cli command to get the status of the execution.

```aws stepfunctions describe-execution --execution-arn {executionARN}```  

Ouput:
You should see that the StepFunction has SUCCEEDED with "output": "{\"food\":\"Pizza\"}", 

2. Now repeat the steps using ```ArnForServiceIntegration``` to execute the StepFunction that uses Step Fuction SDK Service Integration 

```aws stepfunctions start-execution --name "test" --state-machine-arn {ArnForStepFunction_Refactored}```  
```aws stepfunctions describe-execution --execution-arn {executionARN}```

The step function should SUCCEED with similar output as first one.


---


## Cleanup
```cdk destroy```