# Refactoring to Serverless

Serverless is too often conflated with just a code run-time, especially when compared to VMs and container run-times. In reality, seeing it as a complete ecosystem and a new way of building applications not only allows developers to realize the full potential of serverless, it also highlights the strength of AWS serverless ecosystem, which includes orchestration and event bus services.

This project shows developers how to better take advantage of the serverless ecosystem based on a collection of refactorings. Refactoring, a popular coding technique that is supported by most modern IDEs, is defined by Martin Folwer as:

> A disciplined technique for restructuring an existing body of code, altering its internal structure without changing its external behavior

By presenting our design guidance in form of refactorings we can address an audience of enterprise developers who are well-versed in design patterns and refactorings. 

## A Strawman Catalog

Below are few refactoring patterns.

| Name | Description | Status |
| ---- | ---- | ---- |
| [Extract Function Invocation](patterns/extract_function_invocation.md) | Instead calling one Lambda function directly from another, use Lambda Destinations instead | Implemented  |
| [Extract Send Message](patterns/extract_send_message.md) | Instead sending SQS messages via code, use Lambda Destinations instead | Implemented |
| Extract Message Filter | Eliminate invalid messages with EvenBridge instead of conditional statements | Catalog only | 
| Replace Event Pattern with Lambda | If an event pattern can no longer be implemented in EventBridge, build it in Lambda instead | Catalog only |
| Replace Map with Scatter-Gather | Instead of making parallel invocations from a StepFunctions `Map` step, send a message to SNS  | Catalog only |
| [Replace Lambda with Service Integration](patterns/service_integration.md) | Service integratoin allows direct calls to any API from StepFunctions without the need for an additional Lambda function | Implemented |
| Direct database access | Replace a Lambda function that only reads from DynamoDB with Step Functions' `getItem` task  | In Progress (abelfs@) |
| Convert Orchestration to Choreography | Replace central workflow with message flow  | Catalog only |
| Convert Choreography to Orchestration | Replace message flow with central workflow | Catalog only |
| [Replace Polling with Callback](patterns/replace_polling_with_callback.md) | Instead of polling for results, use StepFunctions Wait for a Callback with the Task Token  | Implemented |


## Contributors
Gregor Hohpe, Enterprise Strategist, AWS  
Sindhu Pillai, Sr. Solutions Architect, AWS  
Svenja Raether,Associate ProServe Specialist, AWS  

***Interested in Contributing?*** 
More details [here](CONTRIBUTING.md)