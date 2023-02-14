import { Stack, StackProps } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda"
import { Queue } from 'aws-cdk-lib/aws-sqs';

export class SendMessageStackOriginal extends Stack {
  private bakePizzaLambda: Function
  private pizzaQueue: Queue

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.pizzaQueue = new Queue(this, 'PizzaQueue',{
      queueName: "PizzaQueue"
    });

    const bakePizzaLambdaRole = new iam.Role(this, 'QueueConsumerFunctionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    bakePizzaLambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/bakePizza_original:*'],
    }))

    this.bakePizzaLambda = new Function(this, 'bakePizzaLambda', {
      functionName: `bakePizza_original`,
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset('lambda-fns/send-message-from-code'),
      handler: 'bakePizza.handler',
      environment: {
        QUEUE_URL: this.pizzaQueue.queueUrl
      },
      role: bakePizzaLambdaRole
    });

    this.pizzaQueue.grantSendMessages(this.bakePizzaLambda);
  }

}
