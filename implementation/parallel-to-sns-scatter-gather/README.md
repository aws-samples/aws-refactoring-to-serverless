# Replace Parallel state with SNS for Scatter-Gather refactoring

This project is the CDK implementation of ['Replace Parallel state with SNS for Scatter-Gather'](https://serverlessland.com/refactoring-serverless/parallel-to-sns-scatter-gather) refactoring. It shows how you can use Amazon SNS plus an Aggregator function instead of an Amazon Step Functions to implement the [Scatter-Gather](https://www.enterpriseintegrationpatterns.com/patterns/messaging/BroadcastAggregate.html) integration pattern.

See [Replace Parallel with SNS Scatter-Gather](/patterns/parallel_to_sns_scatter_gather.md) for details on the refactoring from a conceptual point of view.

## How it works

As example use case we use a Car Rental search engine(```requester```) that sends a quote request to several Car Rentals(```responder```). The Car Rental search engine returns the aggregated(```aggregator```) results from multiple suppliers to the user.

The code deploys two stacks:

1. ScatterGatherWithParallelStack
2. ScatterGatherWithSNSStack

Both stacks deploy 3 Lambda functions (application code is re-used for both stacks), ```requester```, ```responder``` and ```aggregator```. The ```requester``` sends a request for quote message with an ```uuid```. Multiple ```responder```(Car Rental) process the message modifying the message adding a ```price_quote```. The Car Rentals configuration parameters are defined in the ```cdk.json``` file. Ultimately, the quotes are aggregated by the ```aggregator``` function (applies only for ```ScatterGatherWithSNSStack```).

ScatterGatherWithParallelStack deploys a Step Function workflow using the parallel state to send a quote request to ```responder```. Each ```responder``` returns a price_quote. The Step Functions parallel state aggregates the results from all responders.

ScatterGatherWithSNSStack replaces the parallel state with SNS. The ```requester``` function sends a quote request to an SNS topic. The SNS topic is subscribed by 2 ```responder``` Lambda functions which return a price_quote and send the message to an SQS queue to aggregate the messages. The ```aggregator``` Lambda function synchronously polls the SQS queue. In order to provide the same aggregation capability as the Step Functions parallel state the ```aggregator``` uses a DynamoDB table to aggregate the price_quotes based on the ```uuid```, ready to be fetched.

## Deploy the solution

The `cdk.json` file tells the CDK Toolkit how to execute your app. To build this app, navigate to `implementation/parallel-to-sns-scatter-gather` folder. Then run the following:

To manually create a virtualenv on MacOS and Linux:

``` bash
python3 -m venv .venv
```

After the init process completes and the virtualenv is created, you can use the following
step to activate your virtualenv.

``` bash
source .venv/bin/activate
```

If you are a Windows platform, you would activate the virtualenv like this:

``` bash
% .venv\Scripts\activate.bat
```

Once the virtualenv is activated, you can install the required dependencies.

``` bash
pip install -r requirements.txt
```

At this point you can now deploy the stacks.

``` bash
cdk deploy --all
```

To add additional dependencies, for example other CDK libraries, just add
them to your `setup.py` file and rerun the `pip install -r requirements.txt`
command.

### Useful commands

* `cdk ls`          list all stacks in the app
* `cdk synth`       emits the synthesized CloudFormation template
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk docs`        open CDK documentation

## Testing it out

* First, lets invoke the step function workflow. Get the Step Function ARN from the Output of the cdk deploy step.(Get ARN from stack outputs: ```ScatterGatherWithParallelStack.StatemachineArn```)

``` bash
aws stepfunctions start-execution --state-machine-arn arn:aws:states:[aws_region]:[account-id]:stateMachine:ParallelStateForScatterGather  --input file://scatter_gather/input.json
```

You should see an output like that

``` Json
{
    "executionArn": "arn:aws:states:us-east-1:446084752553:execution:ParallelStateForScatterGather:eef07f45-bbe8-4b36-9fdd-d96a4634b650",
    "startDate": "2023-04-11T11:16:53.471000+02:00"
}
```

* Next, lets test the refactored version that uses SNS and SQS to implement the Scatter-Gather patten. We will invoke the requester Lambda that triggers the execution. Get the function name from the cdk deploy output (Get function name from stack outputs:```ScatterGatherWithSNSStack.RequesterFunctionName```).

``` bash
aws lambda invoke-async --function-name ScatterGatherWithSNSStack-refactorlambdarequester8-3razgZDKZesx --invoke-args ./scatter_gather/input.json
```

You should see:

``` Json
{
    "Status": 202
}
```

*Note*: We used `invoke-async`  above because Lambda Destinations only supports Asynchronous invocation.

## Verify

Login to your AWS console and navigate to Step Function. Look into the ```ParallelStateForScatterGather``` state machine and verify the execution. Inspect the output of the aggregator step should look similar to the following.

``` Json
{
  "statusCode": 200,
  "body": "[{\"uuid\": \"406ee76b-0f46-4191-9864-572dd153ccd4\", \"quote\": 616}, {\"uuid\": \"406ee76b-0f46-4191-9864-572dd153ccd4\", \"quote\": 770}, {\"uuid\": \"406ee76b-0f46-4191-9864-572dd153ccd4\", \"quote\": 330}, {\"uuid\": \"406ee76b-0f46-4191-9864-572dd153ccd4\", \"quote\": 847}]"
}
```

Next, lets verify the refactored variant using SNS.
First let's get the aggregator log group name. Please replace ```ScatterGatherWithSNSStack-refactorlambdaaggregator-nfXGleA7rZsh``` with your Lambda function name.

``` bash
aws logs describe-log-groups --query 'logGroups[?ends_with(logGroupName, `ScatterGatherWithSNSStack-refactorlambdaaggregator-nfXGleA7rZsh`)].logGroupName' --output text
```

Use the log group name from the previous command to get the logs of the aggregator function and filter by "quotes". Please replace your log group name in the following command.

``` bash
aws logs tail /aws/lambda/ScatterGatherWithSNSStack-refactorlambdaaggregator-nfXGleA7rZsh  --filter-pattern "quotes" 
```

## Cleanup

``` bash
cdk destroy --all
```
