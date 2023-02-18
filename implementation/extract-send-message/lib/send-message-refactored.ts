import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda"
import {Queue} from 'aws-cdk-lib/aws-sqs';
import {SqsDestination} from "aws-cdk-lib/aws-lambda-destinations"
import { aws_iam as iam } from 'aws-cdk-lib';


export class SendMessageStackRefactored extends Stack {

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const deadLetterQueue = new Queue (this, 'PizzaRefactoredDLQ',{
      queueName: "Pizza_Refactored_DLQ"
    });

    const pizzaQueue = new Queue(this, 'PizzaQueue_Refactored',{
      queueName: "PizzaQueue_Refactored",
      deadLetterQueue: {
        queue: deadLetterQueue,
        maxReceiveCount: 3,
      }
    });

    const SQSQueueSSLRequestsOnlyPolicy = new iam.PolicyStatement({
        actions: ['sqs:*'],
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        conditions: { Bool: { 'aws:SecureTransport': 'false' } },
        resources: ['*'],
      })

    pizzaQueue.addToResourcePolicy(SQSQueueSSLRequestsOnlyPolicy)

    deadLetterQueue.addToResourcePolicy(SQSQueueSSLRequestsOnlyPolicy)


    const bakePizzaRefactoredLambdaRole = new iam.Role(this, 'bakePizzaFnRefactoredRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    bakePizzaRefactoredLambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/bakePizza_refactored:*'],
    }))
     
    const bakePizzaLambda = new Function(this, 'bakePizzaUsingDestination', {
      functionName: `bakePizza_refactored`,
      runtime: Runtime.NODEJS_18_X,    
      code: Code.fromAsset('lambda-fns/send-message-using-destination'),         
      handler: 'bakePizza.handler',                
      onSuccess: new SqsDestination(pizzaQueue),
      role:bakePizzaRefactoredLambdaRole
    });

    
  }
}
