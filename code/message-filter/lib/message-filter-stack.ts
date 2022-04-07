import { Stack, StackProps} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets'
import * as sqs from 'aws-cdk-lib/aws-sqs';


export class MessageFilterStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bus = new events.EventBus(this, 'EventBus', {
      eventBusName: 'EventBus'
    })

    const consumerOneBefore = new lambda.Function(this, 'consumerOneBefore', {
      functionName: `ConsumerOneBefore`,
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambdas/consumerOneBefore'),
      handler: 'consumerOne.handler',
    });

    const ruleBefore = new events.Rule(this, 'ruleBefore', {
      eventBus: bus,
      eventPattern: {
        source: ["some-source"],
      },
    });
    ruleBefore.addTarget(new events_targets.LambdaFunction(consumerOneBefore));

    //---------------- Post Refactoring ----------------------

    const messageFilteringBus = new events.EventBus(this, 'MessageFilteringBus', {
      eventBusName: 'MessageFilteringBus'
    })

    const consumerOneAfter = new lambda.Function(this, 'consumerOneAfter', {
      functionName: `ConsumerOneAfter`,
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambdas/consumerOneAfter'),
      handler: 'consumerOne.handler',
    });

    // You can do message filtering based on content
    const ruleAfter = new events.Rule(this, 'ruleAfter', {
      ruleName: 'NameAndLocationRule',
      eventBus: messageFilteringBus,
      eventPattern: 
      {
        "source": ["some-source"],
        "detail": {
          "name": [{
            "anything-but": [""]
          }],
          "location": ["NYC"]
        }
      },
    });

    ruleAfter.addTarget(new events_targets.LambdaFunction(consumerOneAfter));

  }
}
