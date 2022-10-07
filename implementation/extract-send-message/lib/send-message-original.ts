import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda"
import {Queue} from 'aws-cdk-lib/aws-sqs';

export class SendMessageStackOriginal extends Stack {
  private bakePizzaLambda: Function
  private pizzaQueue: Queue

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.pizzaQueue = new Queue(this, 'PizzaQueue',{
      queueName: "PizzaQueue"
    });


    this.bakePizzaLambda = new Function(this, 'bakePizzaLambda', {
      functionName: `bakePizza_original`,
      runtime: Runtime.NODEJS_14_X,           
      code: Code.fromAsset('lambda-fns/send-message-from-code'),         
      handler: 'bakePizza.handler',           
      environment: {
        QUEUE_URL: this.pizzaQueue.queueUrl
      },
    });

    this.pizzaQueue.grantSendMessages(this.bakePizzaLambda);    
  }

}
