
# Replace Map with Scatter-Gather

This project is the CDK implementation of ['Replace Map with Scatter-Gather'](https://serverlessland.com/refactoring-serverless/map-to-scatter-gather) pattern. It shows how yo can use SNS in CDK to replace AWS Step Functions `Map` state to implement the [scatter-gather](https://www.enterpriseintegrationpatterns.com/patterns/messaging/BroadcastAggregate.html) pattern.

## How it works

The code will deploy two stacks:

1. ScatterGatherStack
2. RefactoredScatterGather

Both stacks deploy 3 lambda functions, ```requester```, ```responder``` and ```aggregator```. The ```requester``` sends a message(quote) with a generated ```uuid```, ```responder``` processes the message and outputs a modified message containing a randomly generated ```price_quote```. The ```aggregator``` aggregates the received quotes. Lambda application code is re-used in both stacks.

The first stack deploys a step function workflow implementing the scatter-gather pattern using the map state. When triggered the workflow sends a quote request that is processed by 4 parallel ```responder``` in a map state. The ```responder``` adds price_quotes. When all parallel executions have completed the result is provided aggregated to the ```aggregator``` function.

The second stack implements the scatter-gather pattern using SNS to replace the map state. At invocation the requester function sends the quote request to an SNS topic. Per default there are 4 SQS queues subscribed to the topic. SQS queues are all even sources of ```responder``` functions that generate a price_quote and send (synchronously) a message to an SQS aggregate queue. The ```aggregator``` lambda function synchronously polls the SQS queue. No aggregation logic is provided but the ```uuid``` can be used to aggregate the received quotes at a later stage.

## Deploy the infrastructure

The `cdk.json` file tells the CDK Toolkit how to execute your app. To build this app, navigate to `implementation/map-to-scatter-gather` folder. Then run the following:

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

* First, lets invoke the step function workflow. Get the Step Function ARN from the Output of the cdk deploy step.(Get ARN from stack outputs: ```ScatterGatherStack.StatemachineArn```)

``` bash
aws stepfunctions start-execution --state-machine-arn arn:aws:states:[aws_region]:[account-id]:stateMachine:sfn-mapscatter-gather-workflow  --input file://scatter_gather/input.json
```

You should see an output like that

``` Json
{
    "executionArn": "arn:aws:states:us-east-1:446084752553:execution:sfn-mapscatter-gather-workflow:bff889d4-fcc5-43d7-9bb9-94da5d8c3e95",
    "startDate": "2023-03-29T14:53:31.469000+02:00"
}
```

* Next, lets test the refactored version that uses SNS and SQS to implement the scatter-gather patten. We will invoke the requester lambda that triggers the execution. Get the function name from the cdk deploy output (Get function name from stack outputs:```RefactoredScatterGather.RequesterFunctionName```).

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
