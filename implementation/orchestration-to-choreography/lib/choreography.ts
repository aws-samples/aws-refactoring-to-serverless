import {
  Stack,
  StackProps,
  aws_lambda as lambda,
  aws_iam as iam,
  aws_dynamodb as dynamodb,
  aws_sns as sns,
  aws_sqs as sqs,
  aws_lambda_destinations as destinations,
  aws_lambda_event_sources as sources
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag'
import { Step } from 'aws-cdk-lib/pipelines';

export class ChoreographyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    NagSuppressions.addStackSuppressions(this, [
      {
        id: 'AwsSolutions-IAM5',
        reason: 'log-group arn has :*, it cannot be avoided.'
      },
      {
        id: 'AwsSolutions-SQS3',
        reason: 'we do not configure a DLQ for simplicity'
      },
      {
        id: 'AwsSolutions-SQS4',
        reason: 'we do not do encryption of SQS for simplicity'
      }
    ]);

    const SNSTopic = new sns.CfnTopic(this, 'SNSTopic', {
      topicName: "MortgageQuoteRequest",
      kmsMasterKeyId: "alias/aws/sns"
    });

    // Create the Role
    const choreographyRole = new iam.Role(this, 'ChoreographyRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    choreographyRole.addToPolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: [
        'arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/BankSnsPawnshop:*',
        'arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/BankSnsPremium:*',
        'arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/BankSnsUniversal:*',
        'arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/QuoteAggregator:*'
      ],
    }))

    // Create SNS topic
    const SNSTopicPolicy = new sns.CfnTopicPolicy(this, 'SNSTopicPolicy', {
      policyDocument: {
        "Version": "2008-10-17",
        "Id": "__default_policy_ID",
        "Statement": [
          {
            "Sid": "__default_statement_ID",
            "Effect": "Allow",
            "Principal": { "AWS": "*" },
            "Action": ["SNS:GetTopicAttributes", "SNS:SetTopicAttributes", "SNS:AddPermission", "SNS:RemovePermission", "SNS:DeleteTopic", "SNS:Subscribe", "SNS:ListSubscriptionsByTopic", "SNS:Publish"],
            "Resource": `${SNSTopic.attrTopicArn}`,
            "Condition": {
              "StringEquals": { "AWS:SourceOwner": `${this.account}` }
            }
          }
        ]
      },
      topics: [
        SNSTopic.ref
      ]
    });

    // Create DynamoDB Table
    const DynamoDBTable = new dynamodb.Table(this, 'DynamoDBTable', {
      partitionKey: { name: 'ID', type: dynamodb.AttributeType.STRING },
      tableName: "MortgageQuotes",
    });

    // Create SQS queue
    const SQSQueue = new sqs.Queue(this, 'SQSQueue', {
      queueName: DynamoDBTable.tableName
    });

    // Create Lambda functions
    const bankSnsPawnshopFn = new lambda.Function(this, 'BankSnsPawnshop', {
      environment: {
        max_loan_amount: "500000",
        min_credit_score: "400",
        bank_id: "PawnShop",
        base_rate: "5"
      },
      functionName: "BankSnsPawnshop",
      handler: "BankSns.handler",
      code: lambda.Code.fromAsset('lambda/choreography'),
      role: choreographyRole,
      runtime: lambda.Runtime.NODEJS_18_X,
      onSuccess: new destinations.SqsDestination(SQSQueue)
    });

    bankSnsPawnshopFn.addPermission('SnsInvokeSnsPawnshop', {
      principal: new iam.ServicePrincipal('sns.amazonaws.com'),
      sourceArn: SNSTopic.attrTopicArn,
      action: 'lambda:InvokeFunction',
    });

    const bankSnsPremiumFn = new lambda.Function(this, 'BankSnsPremium', {
      environment: {
        max_loan_amount: "900000",
        min_credit_score: "600",
        bank_id: "Premium",
        base_rate: "3"
      },
      functionName: "BankSnsPremium",
      handler: "BankSns.handler",
      code: lambda.Code.fromAsset('lambda/choreography'),
      role: choreographyRole,
      runtime: lambda.Runtime.NODEJS_18_X,
      onSuccess: new destinations.SqsDestination(SQSQueue)
    });

    bankSnsPremiumFn.addPermission('SnsInvokeSnsPremium', {
      principal: new iam.ServicePrincipal('sns.amazonaws.com'),
      sourceArn: SNSTopic.attrTopicArn,
      action: 'lambda:InvokeFunction',
    });

    const bankSnsUniversalFn = new lambda.Function(this, 'BankSnsUniversal', {
      environment: {
        max_loan_amount: "700000",
        min_credit_score: "500",
        bank_id: "Universal",
        base_rate: "4"
      },
      functionName: "BankSnsUniversal",
      handler: "BankSns.handler",
      code: lambda.Code.fromAsset('lambda/choreography'),
      role: choreographyRole,
      runtime: lambda.Runtime.NODEJS_18_X,
      onSuccess: new destinations.SqsDestination(SQSQueue)
    });

    bankSnsUniversalFn.addPermission('SnsInvokeSnsUniversal', {
      principal: new iam.ServicePrincipal('sns.amazonaws.com'),
      sourceArn: SNSTopic.attrTopicArn,
      action: 'lambda:InvokeFunction',
    });

    const PawnshopSubscription = new sns.CfnSubscription(this, 'PawnshopSubscription', {
      topicArn: SNSTopic.ref,
      endpoint: bankSnsPawnshopFn.functionArn,
      protocol: "lambda",
      region: `${this.region}`
    });

    const PremiumSubscription = new sns.CfnSubscription(this, 'PremiumSubscription', {
      topicArn: SNSTopic.ref,
      endpoint: bankSnsPremiumFn.functionArn,
      protocol: "lambda",
      region: `${this.region}`
    });

    const UniversalSubscription = new sns.CfnSubscription(this, 'UniversalSubscription', {
      topicArn: SNSTopic.ref,
      endpoint: bankSnsUniversalFn.functionArn,
      protocol: "lambda",
      region: `${this.region}`
    });

    const quoteAggregatorFn = new lambda.Function(this, 'QuoteAggregator', {
      functionName: "QuoteAggregator",
      handler: "quoteAggregator.lambda_handler",
      code: lambda.Code.fromAsset('lambda/choreography'),
      role: choreographyRole,
      runtime: lambda.Runtime.PYTHON_3_10
    });

    // QuoteAggregation is triggered by SQS events
    quoteAggregatorFn.addEventSource(new sources.SqsEventSource(SQSQueue, { batchSize: 3 }));

    DynamoDBTable.grantWriteData(quoteAggregatorFn);
    
  }
}
