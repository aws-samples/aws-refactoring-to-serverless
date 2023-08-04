import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class OriginalReplaceEventpatternWithLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a Lambda function as the target for EventBridge
    const lambdadestination_function_1 = new lambda.Function(this, 'OriginalEventDestinationFunction1', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      functionName: 'OriginalEventDestinationFunction1',
      code: lambda.Code.fromAsset('lambda-fns/event-destination-function-1'),
    });

    const lambdadestination_function_2 = new lambda.Function(this, 'OriginalEventDestinationFunction2', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      functionName: 'OriginalEventDestinationFunction2',
      code: lambda.Code.fromAsset('lambda-fns/event-destination-function-2'),
    });

    const eventPatternFilterFunc1: events.EventPattern = {
      source: ['ecommerce.application'],
      detailType: ['user.review'],
      detail: {
        rating: [
          {
            numeric: ['>=', 4.5],
          },
        ],
      },
    };

    // Create the EventBridge rule with the event pattern
    const eventRuleFilter1 = new events.Rule(this, 'EventFilter1', {
      eventPattern: eventPatternFilterFunc1,
    });

    const eventPatternFilterFunc2: events.EventPattern = {
      source: ['ecommerce.application'],
      detailType: ['user.review'],
      detail: {
        rating: [
          {
            numeric: ['<', 2],
          },
        ],
      },
    };

    // Create the EventBridge rule with the event pattern
    const eventRuleFilterFunc2 = new events.Rule(this, 'EventFilter2', {
      eventPattern: eventPatternFilterFunc2,
    });



    eventRuleFilter1.addTarget(new targets.LambdaFunction(lambdadestination_function_1));
    eventRuleFilterFunc2.addTarget(new targets.LambdaFunction(lambdadestination_function_2));

    new cdk.CfnOutput(this, 'LambdaDestinationFunction1Name', {
      value: lambdadestination_function_1.functionName,
      description: 'OriginalEventDestinationFunction1',
    });
    new cdk.CfnOutput(this, 'LambdaDestinationFunction2Name', {
      value: lambdadestination_function_2.functionName,
      description: 'LambdaDestinationFunction2Name',
    });

  }
}
