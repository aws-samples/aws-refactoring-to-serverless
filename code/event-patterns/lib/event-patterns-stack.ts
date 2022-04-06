import { Stack, StackProps,RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { EventBridgeDestination } from 'aws-cdk-lib/aws-lambda-destinations';
import { SqsDestination } from 'aws-cdk-lib/aws-lambda-destinations';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets'
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';




export class EventPatternsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const deadLetterQueue = new sqs.Queue(this, 'DeadLetterQueue',{
      queueName: 'DeadLetterQueue'
    });

    const bus = new events.EventBus(this, 'EventDistributorBus', {
      eventBusName: 'EventDistributorBus'
    })


    //Preprocessing lambda uses Lambda Destination to integrate with EventBus
    const preprocessorLambdaUsingDestination = new lambda.Function(this, 'preprocessorLambdaUsingDestination', {
      functionName: `PreProcessorLambdaUsingDestination`,
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambdas/afterDestination'),
      handler: 'preprocessor.handler',
      retryAttempts: 0,
      onSuccess: new EventBridgeDestination(bus),    //forward to event bus, for downstream processing
      onFailure: new SqsDestination(deadLetterQueue)
    });

     //Preprocessing lambda uses code to pusblish to same EventBus
     const preprocessorLambdaInCode = new lambda.Function(this, 'preprocessorLambdaInCode', {
      functionName: `PreProcessorLambdaInCode`,
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambdas/beforeDestination'),
      handler: 'preprocessor.handler',
      deadLetterQueueEnabled: true,
      retryAttempts: 0,
      deadLetterQueue:  deadLetterQueue,
      environment: {
        EVENTBUS_NAME: bus.eventBusName
      }
    });

    bus.grantPutEventsTo(preprocessorLambdaInCode);


    // You can do event filtering based on the response payload (invocation record) from preprocessing lambda destination
    const studentProcessingRule = new events.Rule(this, 'studentProcessingRule', {
      eventBus: bus,
      description: 'events related to student',
      eventPattern:
      {
        "detail": {
          "requestPayload": {
            "domain": ["student"]
          }
        }
      }
    });

    const schoolProcessingRule = new events.Rule(this, 'schoolProcessingRule', {
      eventBus: bus,
      description: 'events related to school',
      eventPattern:
      {
        "detail": {
          "requestPayload": {
            "domain": ["school"]
          }
        }
      }
    });


    const studentProcessingLambda = new lambda.Function(this, 'studentProcessingLambda', {
      functionName: `StudentProcessingLambda`,
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambdas/students'),
      handler: 'studentProcessing.handler',
    });

    const schoolProcessingLambda = new lambda.Function(this, 'schoolProcessingLambda', {
      functionName: `SchoolProcessingLambda`,
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambdas/school'),
      handler: 'schoolProcessing.handler'
    });

    studentProcessingRule.addTarget(new events_targets.LambdaFunction(studentProcessingLambda));
    schoolProcessingRule.addTarget(new events_targets.LambdaFunction(schoolProcessingLambda));


    //student and school processing lambdas presists data in dynamodb
    const dynamodbStudentTable = new Table(this, 'studentTable', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING
      },
      tableName: 'students',
      removalPolicy: RemovalPolicy.DESTROY, // NOT' recommended for production code
    });
    const dynamodbSchoolTable = new Table(this, 'schoolTable', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING
      },
      tableName: 'schools',
      removalPolicy: RemovalPolicy.DESTROY, // NOT' recommended for production code
    });

    studentProcessingLambda.addEnvironment('TABLE_NAME', dynamodbStudentTable.tableName);
    schoolProcessingLambda.addEnvironment('TABLE_NAME', dynamodbSchoolTable.tableName);
      
    
    dynamodbStudentTable.grantReadWriteData(studentProcessingLambda);
    dynamodbSchoolTable.grantReadWriteData(schoolProcessingLambda);

  }
}
