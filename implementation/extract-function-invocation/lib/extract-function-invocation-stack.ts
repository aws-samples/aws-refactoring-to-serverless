import {
  Stack,
  StackProps,
  aws_lambda as lambda
} from 'aws-cdk-lib';
import { LambdaDestination } from 'aws-cdk-lib/aws-lambda-destinations';
import { Construct } from 'constructs';

export class FunctionInvocationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /* Async Function invocation in code vs. using Lambda Destinations */

    /* COMMON:
     Destination Lambda Fuction logs the received event */
    const destinationFn = new lambda.Function(this, 'destinationFn', {
      functionName: `destinationFn`,
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda/destination'),
      handler: 'index.handler',
    });

    /* BEFORE: 
    Invocation Lambda Fuction before refactoring.
    This function invokes the destination as part of the code. */
    const beforeRefactoringFn = new lambda.Function(this, 'invocationBeforeFn', {
      functionName: 'invocationBeforeFn',
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda/invocation-before'),
      handler: 'index.handler',
      environment: { FUNCTION_NAME: destinationFn.functionName },
    });
    destinationFn.grantInvoke(beforeRefactoringFn);

    /* AFTER:
    Invocation Lambda Fuction after refactoring.
    The invokation destination is extracted from the function code and now configured in CDK code. */
    new lambda.Function(this, 'invocationAfter', {
      functionName: 'invocationAfterFn',
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda/invocation-after'),
      handler: 'index.handler',
      onSuccess: new LambdaDestination(destinationFn, {
        responseOnly: true,
      }),
    }); 

  }
}
