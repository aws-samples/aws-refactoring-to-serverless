import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda"

import {Queue} from 'aws-cdk-lib/aws-sqs';

//Before Refactoring
export class SendMessageFromCodeStack extends Stack {
  private orderPizzaLambda: Function
  private pizzaQueue: Queue

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.pizzaQueue = new Queue(this, 'PizzaQueue',{
      queueName: "PizzaQueue"
    });


    this.orderPizzaLambda = new Function(this, 'OrderPizzaLambda', {
      functionName: `OrderPizza`,
      runtime: Runtime.NODEJS_14_X,           
      code: Code.fromAsset('lambda-fns/send-message-from-code'),         
      handler: 'orderPizza.handler',           
      environment: {
        QUEUE_URL: this.pizzaQueue.queueUrl
      },
    });

    this.pizzaQueue.grantSendMessages(this.orderPizzaLambda);    
  }

}
