# Replace Lambda with Service Integration
This project is the CDK implementation of ['replace-lambda-with-service-integration'](../../patterns/extract_send_message.md) pattern. This pattern shows how you can use service integration provided by AWS Step Function to call any of 200+ AWS services directly from your state machine. 

## How it works
The stacks deploy 2 AWS Step Functions that will detect and list the name of celebrities in given image.
- first Step Function calls AWS Lambda which then calls AWS Rekognition Service *recognizeCelebrities* API
- second *Refactored*  Step Function replaces Lambda to call *recognizeCelebrities* directly using [SDK Service Integration](https://docs.aws.amazon.com/step-functions/latest/dg/supported-services-awssdk.html)

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

Copy value for `ArnForLambdaIntegration` and `ArnForServiceIntegration` from CDK deploy `Outputs`.
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
[
  "Jeff Bezos",
  "Andy Jassy"
]

2. Now repeat the steps using ```ArnForServiceIntegration``` to execute the StepFunction that uses Step Fuction SDK Service Integration 

```aws stepfunctions start-execution --name "test" --state-machine-arn {ArnForServiceIntegration}```  
```aws stepfunctions describe-execution --execution-arn {executionARN}```

Ouput:
[
  "Jeff Bezos",
  "Andy Jassy"
]


---
## Cleanup
```cdk destroy```