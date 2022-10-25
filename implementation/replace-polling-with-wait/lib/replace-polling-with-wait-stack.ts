import {
  Stack,
  StackProps,
  Duration,
  aws_sqs as sqs,
  aws_lambda_event_sources as event,
  aws_lambda as lambda,
  aws_sns as sns,
  aws_stepfunctions as sfn,
  aws_stepfunctions_tasks as tasks
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';

export class ReplacePollingWithWaitStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // sqs queue
    const queue = new sqs.Queue(this, 'pizzaOrderQueue', {
      queueName: 'pizzaOrderQueue'
    });

    // lambda function
    const fn = new lambda.Function(this, 'pizzaBakingFn', {
      functionName: 'pizzaBakingFn',
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-fns/'))
    })

    // add queue as an event source for the lambda function
    fn.addEventSource(new event.SqsEventSource(queue, {
      batchSize: 10
    }));

    // sns topic
    const topic = new sns.Topic(this, 'resultTopic', {
      topicName: 'resultTopic'
    })

    // state machine task 
    const submitTask = new tasks.SqsSendMessage(this, 'submitPizzaOrder', {
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      queue,
      messageBody: sfn.TaskInput.fromObject({
        "input.$" : "$",
        "taskToken": sfn.JsonPath.taskToken,
        "title": 'Pizza order submitted..'
      }),
      timeout: Duration.seconds(30)
    });

    // send success to sns topic
    const notifySuccess = new tasks.SnsPublish(this, 'notifySuccess', {
      message: sfn.TaskInput.fromJsonPathAt('$.message'),
      topic,
      comment: 'order accepted - your pizza is ready!',
      timeout: Duration.seconds(30)
    });

    // send failure to sns topic
    const failed = new sfn.Fail(this, 'failedOrder', {
      cause: 'The order did not receive a reply from SQS-Lambda',
      error: 'Callback timed out',
      comment: 'Order declined - we could not process your order!',
    });

    // add failure notification as catch for success task  
    submitTask.addCatch(failed, {
      errors: ['States.ALL']
    });

    // state machine 
    const stateMachine = new sfn.StateMachine(this, 'StateMachine', {
      definition: submitTask.next(notifySuccess),
      timeout: Duration.minutes(3)
    });

    // grant task response to lambda function
    stateMachine.grantTaskResponse(fn);

  }
}
