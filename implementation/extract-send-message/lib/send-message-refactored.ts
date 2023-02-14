import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda"
import {Queue} from 'aws-cdk-lib/aws-sqs';
import {SqsDestination} from "aws-cdk-lib/aws-lambda-destinations"
import { aws_iam as iam } from 'aws-cdk-lib';


export class SendMessageStackRefactored extends Stack {
  private bakePizzaLambda: Function
  private pizzaQueue: Queue

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.pizzaQueue = new Queue(this, 'PizzaQueue_Refactored',{
      queueName: "PizzaQueue_Refactored"
    });

    const bakePizzaRefactoredLambdaRole = new iam.Role(this, 'bakePizzaFnRefactoredRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    bakePizzaRefactoredLambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/bakePizza_refactored:*'],
    }))
     
    this.bakePizzaLambda = new Function(this, 'bakePizzaUsingDestination', {
      functionName: `bakePizza_refactored`,
      runtime: Runtime.NODEJS_18_X,    
      code: Code.fromAsset('lambda-fns/send-message-using-destination'),         
      handler: 'bakePizza.handler',                
      onSuccess: new SqsDestination(this.pizzaQueue),
      role:bakePizzaRefactoredLambdaRole
    });

    
  }
}
