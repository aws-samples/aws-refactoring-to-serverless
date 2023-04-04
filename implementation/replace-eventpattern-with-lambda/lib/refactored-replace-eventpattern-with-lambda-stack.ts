import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class RefactoredReplaceEventpatternWithLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a Lambda function as the target for lambda filter function
    const lambdadestination_function_1 = new lambda.Function(this, 'RefactoredEventDestinationFunction1', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      functionName: 'RefactoredEventDestinationFunction1',
      code: lambda.Code.fromAsset('lambda-fns/event-destination-function-1'),
    });

    // Create a Lambda function as the target for lambda filter function
    const lambdadestination_function_2 = new lambda.Function(this, 'RefactoredEventDestinationFunction2', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      functionName: 'RefactoredEventDestinationFunction2',
      code: lambda.Code.fromAsset('lambda-fns/event-destination-function-2'),
    });

    // Create a Lambda function as the target for EventBridge to filter and route messages
    const event_filter_function = new lambda.Function(this, 'EventFilterFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      functionName: 'EventFilterFunction',
      code: lambda.Code.fromAsset('lambda-fns/event-filter-function'),
      environment: {
        LAMBDA_DEST_FUNCTION_1: lambdadestination_function_1.functionName,
        LAMBDA_DEST_FUNCTION_2: lambdadestination_function_2.functionName
      }
    });

    // Grant the event_filter_function permission to invoke the destination Lambda functions
    lambdadestination_function_1.grantInvoke(event_filter_function)
    lambdadestination_function_2.grantInvoke(event_filter_function)

    // Define the EventBridge event pattern
    const eventPatternPass: events.EventPattern = {
      source: ['ecommerce.application'],
      detailType: ['user.review'],
    };

    // Create the EventBridge rule with the event pattern
    const eventRulePass = new events.Rule(this, 'FilterWithLambda', {
      eventPattern: eventPatternPass,
    });

    // Add the event_filter_function as a target for the EventBridge rule
    eventRulePass.addTarget(new targets.LambdaFunction(event_filter_function));

  }
}
