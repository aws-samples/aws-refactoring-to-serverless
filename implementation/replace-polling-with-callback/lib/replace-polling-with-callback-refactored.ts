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

export class CallbackExample extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    // The queue (and DLQ) for new pizza orders
    const orderDLQ = new sqs.Queue(this, 'orderDLQ', {
      queueName: "pizzaRefactoredDLQ"
    });

    const orderQueue = new sqs.Queue(this, 'pizzaOrderQueue', {
      queueName: 'pizzaOrderQueueRefactored',
      deadLetterQueue: {
        queue: orderDLQ,
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

    //Adding SSL policy from the standpoint of best practices
    [orderQueue, orderDLQ].forEach(queue => {
      queue.addToResourcePolicy(SQSQueueSSLRequestsOnlyPolicy)
    })

    const pizzaBakingRefactoredLambdaRole = new iam.Role(this, 'pizzaBakingRefactoredLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    pizzaBakingRefactoredLambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/pizzaBakingFnRefactored:*'],
    }))

    // Lambda function that processes the pizza order
    const bakingFn = new lambda.Function(this, 'pizzaBakingFn', {
      functionName: 'pizzaBakingFnRefactored',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'refactored.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-fns/processing')),
      role:pizzaBakingRefactoredLambdaRole
    })

    // add queue as an event source for the lambda function
    bakingFn.addEventSource(new event.SqsEventSource(orderQueue, {
      batchSize: 1
    }));

    // state machine task 
    const submitTask = new tasks.SqsSendMessage(this, 'Submit Order', {
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      queue: orderQueue,
      messageBody: sfn.TaskInput.fromObject({
        "input.$": "$",
        "taskToken": sfn.JsonPath.taskToken,
        "title": 'Pizza order submitted..'
      }),
      taskTimeout: sfn.Timeout.duration(Duration.seconds(30))
    });

    const succeed = new sfn.Succeed(this, 'Order Succeeded', {
      comment: 'Order processed - your pizza is ready!',
      outputPath: '$.message'
    });

    // Flag failure if waiting for callback timed out
    const fail = new sfn.Fail(this, 'Order Failed', {
      comment: 'Order declined - we could not process your order!',
      cause: 'The order did not receive a callback from the baking function',
      error: 'Callback timed out',
    });

    // add failure notification as catch for success task  
    submitTask.addCatch(fail, {
      errors: ['States.ALL']
    });

    // state machine 
    const stateMachine = new sfn.StateMachine(this, 'StateMachine', {
      stateMachineName: 'StepFunctionWithCallback',
      definition: submitTask.next(succeed),
      timeout: Duration.seconds(30)
    });

    // grant task response to lambda function
    stateMachine.grantTaskResponse(bakingFn);

  }
}
