# Replace Parallel state with SNS for Scatter-Gather pattern

This project is the CDK implementation of ['Replace Parallel state with SNS for Scatter-Gather'](https://serverlessland.com/refactoring-serverless/parallel-to-sns-scatter-gather) pattern. It shows how yo can use SNS in CDK to replace AWS Step Functions `Map` state to implement the [Scatter-Gather](https://www.enterpriseintegrationpatterns.com/patterns/messaging/BroadcastAggregate.html) pattern.

## How it works

The code will deploy two stacks:

1. ScatterGatherWithParallelStack
2. ScatterGatherWithSNSStack

Both stacks deploy 3 lambda functions (application code is re-used for both stacks), ```requester```, ```responder``` and ```aggregator```. The ```requester``` sends a request for quote message providing it with a ```uuid```, multiple ```responder``` will processes the message and outputs a modified message containing a ```price_quote``` specific to the vendor (provided as config parameter in ```cdk.json``` file). The ```aggregator``` aggregates the received quotes.

ScatterGatherWithParallelStack deploys a Step Function workflow using the parallel state to send a quote request 2 ```responder```. Each ```responder``` adds a price_quote to the original message. When all parallel executions have completed the result is aggregated by the Step Function parallel state.

ScatterGatherWithSNSStack replaces the parallel state with SNS. The ```requester``` function sends a quote request to an SNS topic. The SNS topic is subscribed by 2 ```responder``` Lambda functions which add a price_quote and send the message to an SQS to aggregate the messages. The ```aggregator``` lambda function synchronously polls the SQS queue. No aggregation logic is provided but the ```uuid``` can be used to determine the quote request the price quote belongs.

## Deploy the infrastructure

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

* First, lets invoke the step function workflow. Get the Step Function ARN from the Output of the cdk deploy step.(Get ARN from stack outputs: ```RefactoredlScatterGatherStack.StatemachineArn```)

``` bash
aws stepfunctions start-execution --state-machine-arn arn:aws:states:[aws_region]:[account-id]:stateMachine:ParallelStateForScatterGather  --input file://scatter_gather/input.json
```

You should see an output like that

``` Json
{
    "executionArn": "arn:aws:states:us-east-1:446084752553:execution:sfn-mapscatter-gather-workflow:bff889d4-fcc5-43d7-9bb9-94da5d8c3e95",
    "startDate": "2023-03-29T14:53:31.469000+02:00"
}
```

* Next, lets test the refactored version that uses SNS and SQS to implement the Scatter-Gather patten. We will invoke the requester lambda that triggers the execution. Get the function name from the cdk deploy output (Get function name from stack outputs:```RefactoredScatterGather.RequesterFunctionName```).

``` bash
aws lambda invoke-async --function-name RefactoredScatterGather-refactorlambdarequester8C7-Zr686IpjPlC5 --invoke-args ./scatter_gather/input.json
```

You should see:

``` Json
{
    "Status": 202
}
```

*Note*: We used `invoke-async`  above because Lambda Destinations only supports Asynchronous invocation.

## Verify

Login to your AWS console and navigate to Step Function. Look into the ```sfn-mapscatter-gather-workflow``` state machine and verify the execution. Inspect the output of the aggregator step should look similar to the following.

``` Json
{
  "statusCode": 200,
  "body": "[{\"uuid\": \"406ee76b-0f46-4191-9864-572dd153ccd4\", \"quote\": 616}, {\"uuid\": \"406ee76b-0f46-4191-9864-572dd153ccd4\", \"quote\": 770}, {\"uuid\": \"406ee76b-0f46-4191-9864-572dd153ccd4\", \"quote\": 330}, {\"uuid\": \"406ee76b-0f46-4191-9864-572dd153ccd4\", \"quote\": 847}]"
}
```

Next, lets verify the refactored variant using SNS and SQS. Navigate to CloudWatch logs and select the log group of the aggregator lambda function.

In the logstreams you should look for ```quotes:[{'uuid': '1ed49edb-0e9b-4e1c-9ef7-893fe7014149', 'quote': 330}]```.

## Cleanup

``` bash
cdk destroy --all
```
