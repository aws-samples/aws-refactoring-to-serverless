import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Runtime, AssetCode, Code } from "aws-cdk-lib/aws-lambda"
import {SqsDestination} from "aws-cdk-lib/aws-lambda-destinations"

import {Queue} from 'aws-cdk-lib/aws-sqs';

// After Refactoring 
export class SendMessageFromDestinationStack extends Stack {
  private orderPizzaLambda: Function
  private pizzaQueue: Queue

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.pizzaQueue = new Queue(this, 'pizzaQueue',{
      queueName: "pizzaQueue1"
    });
     
    this.orderPizzaLambda = new Function(this, 'orderPizzaUsingDestination', {
      functionName: `OrderPizzaUsingDestination`,
      runtime: Runtime.NODEJS_14_X,           
      code: Code.fromAsset('lambda-fns/send-message-from-destination'),         
      handler: 'orderPizza.handler',                
      onSuccess: new SqsDestination(this.pizzaQueue)
    });

    
  }
}
