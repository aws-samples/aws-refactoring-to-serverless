import {
    Stack,
    StackProps,
    Duration,
    aws_sqs as sqs,
    aws_lambda_event_sources as event,
    aws_lambda as lambda,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
    aws_lambda_destinations as destinations
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';

export class PollingExample extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        // sqs queues
        const orderQueue = new sqs.Queue(this, 'pizzaOrderQueue', {
            queueName: 'pizzaOrderQueue'
        });

        const outputQueue = new sqs.Queue(this, 'outputQueue', {
            queueName: 'pizzaOutputQueue',
            deliveryDelay: Duration.seconds(15),
        });

        // lambda function to process the message
        const bakingFn = new lambda.Function(this, 'pizzaBakingFn', {
            functionName: 'pizzaBakingFn',
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: 'before.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-fns/processing')),
            environment: {
                QUEUE_URL: outputQueue.queueUrl
            },
        });

        // add queue as an event source for the lambda function
        bakingFn.addEventSource(new event.SqsEventSource(orderQueue, {
            batchSize: 1
        }));
        // grant send permissions to the lambda function
        outputQueue.grantSendMessages(bakingFn);

        // lambda function to poll the output queue
        const pollingFn = new lambda.Function(this, 'pollingFn', {
            functionName: `pollingFn`,
            runtime: lambda.Runtime.NODEJS_16_X,
            handler: 'before.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-fns/polling')),
            environment: {
                QUEUE_URL: outputQueue.queueUrl
            },
            timeout: Duration.seconds(30)
        });

        // grant consume permissions to the lambda function
        outputQueue.grantConsumeMessages(pollingFn);

        // state machine task 
        const submitTask = new tasks.SqsSendMessage(this, 'Submit Order', {
            integrationPattern: sfn.IntegrationPattern.REQUEST_RESPONSE,
            queue: orderQueue,
            messageBody: sfn.TaskInput.fromObject({
                "input.$": "$",
                "title": 'Pizza order submitted..'
            }),
            timeout: Duration.seconds(30),
            resultPath: '$.guid',
        });

        const waitX = new sfn.Wait(this, 'Wait X Seconds', {
            time: sfn.WaitTime.secondsPath('$.waitTime'),
        });

        const getStatus = new tasks.LambdaInvoke(this, 'Polling from queue', {
            lambdaFunction: pollingFn,
            resultPath: '$.status',
            payloadResponseOnly: true
        });

        // success state
        const succeed = new sfn.Succeed(this, 'Order Suceeded', {
            comment: 'Order proceeded - your pizza is ready!',
            outputPath: '$.status'
        });

        // failed state
        const fail = new sfn.Fail(this, 'Order Failed', {
            comment: 'Order declined - we could not process your order!',
            cause: 'The order did not receive a reply',
            error: 'Polling timed out',
        });

        // add failure as catch for the submit task  
        submitTask.addCatch(fail, {
            errors: ['States.ALL']
        });

        // state machine 
        new sfn.StateMachine(this, 'StateMachine', {
            stateMachineName: 'PizzaPolling',
            definition: submitTask
                .next(waitX)
                .next(getStatus)
                .next(new sfn.Choice(this, 'Pizza ready?')
                    // Look at the "status" field
                    .when(sfn.Condition.stringEquals('$.status.status', 'FAILED'), fail)
                    .when(sfn.Condition.stringEquals('$.status.status', 'SUCCEEDED'), succeed)
                    .otherwise(waitX)),
            timeout: Duration.minutes(1),
        });

    }
}
