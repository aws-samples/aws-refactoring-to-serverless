import {
    Stack,
    StackProps,
    Duration,
    aws_sqs as sqs,
    aws_lambda_event_sources as event,
    aws_lambda as lambda,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
    aws_iam as iam
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';

export class PollingExample extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        
        // The queue (and DLQ) for new pizza orders
        const orderDLQ = new sqs.Queue(this, 'orderDLQ', {
            queueName: "pizzaOrderDLQ"
        });

        const orderQueue = new sqs.Queue(this, 'pizzaOrderQueue', {
            queueName: 'pizzaOrderQueue',
            deadLetterQueue: {
                queue: orderDLQ,
                maxReceiveCount: 3,
            }
        });

        // The queue (and DLQ) for completed pizza orders
        const outputDLQ = new sqs.Queue(this, 'outputDLQ', {
            queueName: "pizzaOutputDLQ"
        });

        const outputQueue = new sqs.Queue(this, 'outputQueue', {
            queueName: 'pizzaOutputQueue',
            deliveryDelay: Duration.seconds(15),
            deadLetterQueue: {
                queue: outputDLQ,
                maxReceiveCount: 3,
            }
        });

        const SQSQueueSSLRequestsOnlyPolicy = new iam.PolicyStatement({
            actions: ['sqs:*'],
            effect: iam.Effect.DENY,
            principals: [new iam.AnyPrincipal()],
            conditions: { Bool: { 'aws:SecureTransport': 'false' } },
            resources: ['*'],
        });

        // Adding SSL policy from the standpoint of best practices
        [orderQueue, outputQueue, orderDLQ, outputDLQ].forEach(queue => {
            queue.addToResourcePolicy(SQSQueueSSLRequestsOnlyPolicy)
        })

        const pizzaBakingLambdaRole = new iam.Role(this, 'pizzaBakingLambdaRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        });

        pizzaBakingLambdaRole.addToPolicy(new iam.PolicyStatement({
            actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
            resources: ['arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/pizzaBakingFn:*'],
        }))

        // Lambda function that processes the pizza order
        const bakingFn = new lambda.Function(this, 'pizzaBakingFn', {
            functionName: 'pizzaBakingFn',
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'before.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-fns/processing')),
            environment: {
                QUEUE_URL: outputQueue.queueUrl
            },
            role: pizzaBakingLambdaRole
        });

        // add order queue as an event source for the lambda function
        bakingFn.addEventSource(new event.SqsEventSource(orderQueue, {
            batchSize: 1
        }));
        outputQueue.grantSendMessages(bakingFn);

        const pollingLambdaRole = new iam.Role(this, 'pollingLambdaRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        });

        pollingLambdaRole.addToPolicy(new iam.PolicyStatement({
            actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
            resources: ['arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/pollingFn:*'],
        }))

        // lambda function to check queue for completed orders
        const pollingFn = new lambda.Function(this, 'pollingFn', {
            functionName: `pollingFn`,
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'checkStatus.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-fns/polling')),
            environment: {
                QUEUE_URL: outputQueue.queueUrl
            },
            timeout: Duration.seconds(30),
            role: pollingLambdaRole
        });
        outputQueue.grantConsumeMessages(pollingFn);

        // state machine task 
        const submitTask = new tasks.SqsSendMessage(this, 'Submit Order', {
            integrationPattern: sfn.IntegrationPattern.REQUEST_RESPONSE,
            queue: orderQueue,
            messageBody: sfn.TaskInput.fromObject({
                "input.$": "$",
                "title": 'Pizza order submitted..'
            }),
            taskTimeout: sfn.Timeout.duration(Duration.seconds(30)),
            resultPath: '$.guid',
        });

        const waitX = new sfn.Wait(this, 'Wait 5 Seconds', {
            time: sfn.WaitTime.duration(Duration.seconds(5)),
        });

        const getStatus = new tasks.LambdaInvoke(this, 'Get Pizza Status', {
            lambdaFunction: pollingFn,
            resultPath: '$.status',
            payloadResponseOnly: true
        });

        // success state
        const succeed = new sfn.Succeed(this, 'Order Succeeded', {
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
        const stateMachine = new sfn.StateMachine(this, 'StateMachine', {
            stateMachineName: 'StepFunctionWithPolling',
            definition: submitTask
                .next(waitX)
                .next(getStatus) //poll
                .next(new sfn.Choice(this, 'Pizza ready?')
                    .when(sfn.Condition.stringEquals('$.status.status', 'FAILED'), fail)
                    .when(sfn.Condition.stringEquals('$.status.status', 'SUCCEEDED'), succeed)
                    .otherwise(waitX)),
            timeout: Duration.minutes(1),
        });

    }
}
