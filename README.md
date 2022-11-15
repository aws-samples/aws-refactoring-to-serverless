# Refactoring to Serverless

Serverless is too often conflated with just a code run-time, especially when compared to VMs and container run-times. In reality, seeing it as a complete ecosystem and a new way of building applications not only allows developers to realize the full potential of serverless, it also highlights the strength of AWS serverless ecosystem, which includes orchestration and event bus services.

This project shows developers how to better take advantage of the serverless ecosystem based on a collection of refactorings. Refactoring, a popular coding technique that is supported by most modern IDEs, is defined by Martin Folwer as:

> A disciplined technique for restructuring an existing body of code, altering its internal structure without changing its external behavior

By presenting our design guidance in form of refactorings we can address an audience of enterprise developers who are well-versed in design patterns and refactorings. 

## Refactoring to Serverless Patterns: An Example

We routinely see Lambda code that performs functions that could be more easily and more reliably performed by using a platform feature. For example, the following code was taken from a GitHub example:

```
queue_name = os.environ['SQS_NAME']
sqs = boto3.resource('sqs')
queue = sqs.get_queue_by_name(QueueName=queue_name)

def handler(event, context):
   ...
  response = queue.send_message(MessageBody='world')
```

This code isn't just unnecessary, it also hides the application topology: the relationship between this function and the SQS queue (defined by an environment setting) is not visible unless one inspects the source code.
The refactoring replaces this code with a Lambda destination, ideally defined in AWS CDK. By extracting the the sending of the message to an SQS channel, this dependencty becomes explicit in the automation code. It also better separates application logic (in the function code) from composition (in CDK code).

As any good pattern, this refactoring should highlight advantages and disadvantages. For example, some refactorings would introduce additional runtime elements, such as EventBridge, which carry a cost or introduce more moving parts. Good documents include a balanced discussion on such trade-offs.

The skeleton for this pattern can be found at [Extract Send Message](patterns/extract_send_message.md)

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

## Refactoring Catalog Format

Each pattern in this catalog adheres to the following format:

* Name - an evocative name is important for the community to adopt the vocabulary. A builder should be able to say “I think we should extract this invocation into a destination”
* Diagram / Sketch - a visual that captures the essence of the pattern. It doesn’t have to be a class diagram or full-on architecture diagram. Recognizability is most important: can a developer see what the refactoring suggests just from the visual
* Description - one paragraph describing what the refactoring suggests, including the benefits
* Implementation - a longer description that explains how to do it
* Considerations - things to keep in mind when using this refactoring
* Related Refactorings - If someone uses this one, what other refactoring could logically follow?

---

## Contributors
Gregor Hohpe, Enterprise Strategist, AWS  
Sindhu Pillai, Sr. Solutions Architect, AWS  
Svenja Raether,Associate ProServe Specialist, AWS  

***Interested in Contributing?*** 
More details [here](CONTRIBUTING.md)