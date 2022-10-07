import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda"
import {Queue} from 'aws-cdk-lib/aws-sqs';
import {SqsDestination} from "aws-cdk-lib/aws-lambda-destinations"

export class SendMessageStackRefactored extends Stack {
  private bakePizzaLambda: Function
  private pizzaQueue: Queue

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.pizzaQueue = new Queue(this, 'PizzaQueue_Refactored',{
      queueName: "PizzaQueue_Refactored"
    });
     
    this.bakePizzaLambda = new Function(this, 'bakePizzaUsingDestination', {
      functionName: `bakePizza_refactored`,
      runtime: Runtime.NODEJS_14_X,           
      code: Code.fromAsset('lambda-fns/send-message-using-destination'),         
      handler: 'bakePizza.handler',                
      onSuccess: new SqsDestination(this.pizzaQueue)
    });

    
  }
}
