import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from "aws-cdk-lib/aws-lambda"
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import { CfnPipe } from 'aws-cdk-lib/aws-pipes';
import { PolicyDocument, Role, ServicePrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as targets from 'aws-cdk-lib/aws-events-targets';


export class ExtractMessageFilterRefactoredStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const claimProcessor = new lambda.Function(this, 'ClaimProcessorLambda', {
      functionName: 'ClaimProcessorRefactored',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda/claim-processor'),
      handler: 'index.handler',
    });

    const mediaProcessor = new lambda.Function(this, 'MediaProcessorLambda', {
      functionName: 'MediaProcessorRefactored',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda/media-processor'),
      handler: 'index.handler',
    });

    const defaultProcessor = new lambda.Function(this, 'DefaultProcessorLambda', {
      functionName: 'DefaultProcessorRefactored',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda/default-processor'),
      handler: 'index.handler',
    });


    const recordsTable = new dynamodb.Table(this, 'RecordsTable', {
      tableName: 'RecordsTableRefactored',
      partitionKey: {
        name:'recordId', 
        type: dynamodb.AttributeType.STRING
      },
      // enable streams
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // event bus for dynamodb stream events
    const recordsEventBus = new EventBus(this, 'RecordsEventBus', {
      eventBusName: 'RecordsEventBusRefactored',
    });

    // rule for claim processor
    const claim_rule = new Rule(this, 'ClaimRule', {
      eventBus: recordsEventBus,
      eventPattern: {        
          detail: {
            "dynamodb.NewImage.claimId.S": [{
              "anything-but": [ "" ] 
            }],
            "dynamodb.NewImage.type.S": ["claim"]
          }
      }
    }).addTarget(new targets.LambdaFunction(claimProcessor))

    // rule for media processor
    const media_rule = new Rule(this, 'MediaRule', {
      eventBus: recordsEventBus,
      eventPattern: {
        detail: {
          "dynamodb.NewImage.type.S": [ "media" ],
          "dynamodb.NewImage.mediaType.S": [ "image", "video", "pdf" ],
        }
      }
    }).addTarget(new targets.LambdaFunction(mediaProcessor))
    
    // rule for default processor, if all other rules did not match
    const default_rule = new Rule(this, 'DefaultRule', {
      eventBus: recordsEventBus,
      eventPattern: {
        detail: {
          "$or": [{
            "dynamodb.NewImage.type.S": [ { "anything-but": [ "claim", "media" ] } ],
          }, {
            "dynamodb.NewImage.type.S": [ "media" ],
            "dynamodb.NewImage.mediaType.S": [ { "anything-but": ["image", "video", "pdf" ]}],
          }, {
            "dynamodb.NewImage.type.S": ["claim"],
            // no support for null values yet, could be solved with a custom resource
            // "dynamodb.NewImage.claimId.S": ["", null],
            "dynamodb.NewImage.claimId.S": ["", undefined],
          }, {
            "dynamodb.NewImage.type.S": ["claim"],
            "dynamodb.NewImage.claimId.S": [{ "exists": false  }]
          }]
        }
      }
    }).addTarget(new targets.LambdaFunction(defaultProcessor))

    // Permissions for the EB pipe
    const sourcePolicy = new PolicyDocument({
      statements: [
        new PolicyStatement({
          resources: [recordsTable.tableStreamArn!],
          actions: [
            'dynamodb:DescribeStream',
            'dynamodb:GetRecords',
            'dynamodb:GetShardIterator',
            'dynamodb:ListStreams'  
          ],
          effect: iam.Effect.ALLOW,
        }),
      ],
    });
    const targetPolicy = new PolicyDocument({
      statements: [
        new PolicyStatement({
          resources: [recordsEventBus.eventBusArn],
          actions: ['events:PutEvents'],
          effect: iam.Effect.ALLOW,
        }),
      ],
    });

    const pipeRole = new Role(this, 'role', {
      assumedBy: new ServicePrincipal('pipes.amazonaws.com'),
      inlinePolicies: {
        sourcePolicy,
        targetPolicy,
      },
    });

    // EB pipe (L1 construct for now)
    const pipe = new CfnPipe(this, 'pipe', {
      roleArn: pipeRole.roleArn,
      source: recordsTable.tableStreamArn!,
      sourceParameters: {
        dynamoDbStreamParameters: {
          startingPosition: 'LATEST'
        },
        // only process insert events
        filterCriteria: {
          filters: [{
            pattern: '{"eventName" : ["INSERT"] }',
          }]
        }
      },
      target: recordsEventBus.eventBusArn,
      targetParameters: {
        eventBridgeEventBusParameters: {
          detailType: 'record-details',
          source: 'records-table',
        }
      },
    });

  }
}
