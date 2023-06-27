# Replace Polling with Callback

This project is the CDK implementation of the refactoring ['Replace Polling with Callback'](https://serverlessland.com/refactoring-serverless/replace-polling-with-callback). It shows how you can use AWS Step Function's 'Wait for task token' integration pattern to call a service with a task token and wait until that token is returned with a payload.

## How it works
The State Machine receives a new pizza order, which it writes to an SQS queue for processing by a Lambda Function responsible for pizza baking. This can take some time. The workflow returns a success message once the pizza is ready. 

The code deploys two versions of the AWS Step Function State Machines. 
- Order pizza and poll for the result: This uses step function's Wait state and a Lambda invocation to periodically poll an SQS queue for the completed pizza order, waits for 5 sec, and retries until it receives the result.
- Order pizza with a callback: This uses Step Function's Wait for a Callback task, which the baking function invokes, passing the Task Token.


## Deploy the infrastructure

Have the [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configured with permissions to create those resources. 

### Build

To build this app, you need to be in this example's root folder. Then run the following:
```bash
npm install
npm run build
cdk synth
```

This will install this example's dependencies, compile typescript to js, and emit the synthesized CloudFormation template for this stack.

### Deploy

0. Bootstrap the environment if you have not used AWS CDK in the deployment region for your account
``` 
cdk bootstrap
```

1. Run below to deploy / redeploy this Stack to your AWS Account:
``` 
cdk deploy --all
```

2. Select `y` to create the stack:
`Do you wish to deploy these changes (y/n)?`

## Testing it out

- First, let's invoke the state machine that polls for the message:
``` 
aws stepfunctions start-execution \
--state-machine-arn <state-machine-arn> \
--input "{\"name\" : \"pizza_callback\", \"order\" : \"pizza margherita\"}"
```

You should see following output in in the AWS CLI:
``` 
{
    "executionArn": <execution-arn>,
    "startDate":  <start-date>
}
```

- Next, let's invoke the state machine that uses the callback integration pattern:
``` 
aws stepfunctions start-execution \
--state-machine-arn <state-machine-arn> \
--input "{\"name\" : \"pizza_callback\", \"order\" : \"pizza funghi\"}"
```

You should see following output in in the AWS CLI:
```  
{
    "executionArn": <execution-arn>,
    "startDate":  <start-date>
}
```

## Validate

The polling example should show the following execution graph: 
<p align="center">
<img src="images/stepfunctions_graph_before.png" alt="Polling for result" width="250"/>
</p>


The callback example should show the following execution graph: 
<p align="center">
<img src="images/stepfunctions_graph_refactored.png" alt="Callback after result" width="250"/>
</p>

## Clean up

1. Remove your CDK stack:
```
cdk destroy --all
```

2. Select `y` to delete the stack:
Are you sure you want to delete: <stack-names> (y/n)?


