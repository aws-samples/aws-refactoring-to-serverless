# Refactoring to Serverless
Refactoring, a popular coding technique is defined by Martin Folwer as:

> A disciplined technique for restructuring an existing body of code, altering its internal structure without changing its external behavior.

Refactoring to Serverless aims to move code from the application to CDK automation.

## Why refactor to serverless?

There are multiple benefits to refactoring your solution to serverless:

* The refactored code better *leverages platform capabilities*. Automation features don't need code library upgrades, testing, or debugging. They also generally scale better and are more robust than application code.
* AWS continually adds *new services and capabilities*, so you might find that you had written application code for a function that can now be done using a service capability. Time to refactor!
* Occasionally your *application's needs outgrow the capability* of one service. For example, EventBridge has many features to filter incoming messages but if your application's needs evolve to require a complex rule across multiple fields, you might need to refactor from EventBridge to a custom lambda function.
* Refactoring to serverless can *improve your run-time characteristics* and reduce cost. For example, if you can replace polling for results with a callback or a wait state, you reduce latency and cost.

Because of these benefits, refactoring should be an integral part of serverless development.


## About this repo:
This repo is AWS CDK implementation for the patterns in [Refactorings to Serverless](https://serverlessland.com/refactoring-serverless/intro).  


| Name | Description |
| ---- | ---- |
| [Extract Function Invocation](patterns/extract_function_invocation.md) | Instead of calling one Lambda function directly from another, use Lambda Destinations instead |
| [Extract Send Message to Lambda Destination](patterns/extract_send_message.md) | Instead of sending SQS messages via code, use Lambda Destinations instead |
| [Replace Lambda with Service Integration](patterns/service_integration.md) | Service integration allows direct calls to any AWS Service API from StepFunctions without the need for an additional Lambda function |
| [Replace Polling with Callback](patterns/replace_polling_with_callback.md) | Instead of polling for results, use StepFunctions Wait for a Callback with the Task Token  |
| [Direct database access](patterns/direct_database_access.md) | Replace a Lambda function that only reads from DynamoDB with Step Functions' `getItem` task  |
| [Extract Send Message to DynamoDB Stream](patterns/send-message-via-pipes.md) | Instead of a Lambda function sending a message after updating DynamoDB, use DynamoDB Streams plus EventBridge Pipes|
| [Replace Event Pattern with Lambda](patterns/replace_event_pattern_with_lambda.md) | If an event pattern can no longer be implemented in EventBridge, build it in Lambda instead  |



## Owners
Gregor Hohpe, Enterprise Strategist, AWS  
Sindhu Pillai, Sr. Solutions Architect, AWS  

## Contributors
Svenja Raether,Associate ProServe Specialist, AWS  
Abel Fresnillo Silva, Sr. Solutions Architect, AWS  
Eugene Kim, Sr. Solutions Architect, AWS
Agostino Di Figlia, Sr. Cloud Application Architect, AWS

## Interested in Contributing?
More details [here](CONTRIBUTING.md)
