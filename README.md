# Refactoring to Serverless

Serverless is too often conflated with just a code run-time, especially when compared to VMs and container run-times. In reality, seeing it as a complete ecosystem and a new way of building applications not only allows developers to realize the full potential of serverless, it also highlights the strength of AWS serverless ecosystem, which includes orchestration and event bus services.

This project shows developers how to better take advantage of the serverless ecosystem based on a collection of refactorings. Refactoring, a popular coding technique that is supported by most modern IDEs, is defined by Martin Folwer as:

> A disciplined technique for restructuring an existing body of code, altering its internal structure without changing its external behavior

By presenting our design guidance in form of refactorings we can address an audience of enterprise developers who are well-versed in design patterns and refactorings. 

## Refactoring to Serverless Patterns: An Example

I routinely see Lambda code that performs functions that could be more easily and more reliably performed by using a platform feature. For example, the following code was taken from a GitHub example:

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

The skeleton for this pattern can be found at [Extraxct Send Message](patterns/extract_send_message.md)

## A Strawman Catalog

These are some very initial refactoring ideas. The goal of the project would be to find many more and document them:

* Extract Function Invocation
* [Extract Sending Message](patterns/extract_send_message.md)
* Extract Message Filter to EventBridge
* Replace Step Function Map with Scatter-Gather
* Orchestration to Choreography
* Choreography to Orchestration
* Replace Polling with Wait State

## Refactoring Catalog Format

Each pattern in the catalog adheres to the following format:

* Name - an evocative name is important for the community to adopt the vocabulary. A builder should be able to say “I think we should extract this invocation into a destination”
* Diagram / Sketch - a visual that captures the essence of the pattern. It doesn’t have to be a class diagram or full-on architecture diagram. Recognizability is most important: can a developer see what the refactoring suggests just from the visual
* Description - one paragraph describing what the refactoring suggests, including the benefits
* Implementation - a longer description that explains how to do it
* Considerations - things to keep in mind when using this refactoring
* Related Refactorings - If someone uses this one, what other refactoring could logically follow?

## Contributing

This project is open for contributions. 
* Each contributor should implement and document one refactoring from the list above. 
* The implementation of the 'before' and 'after' examples can be in Python or Typescript
* The 'after' example uses CDK
* The documentation is in markdown
* The examples might require some scaffolding, shich we don't include in the documentation. We currently copy the code into the documentation manually. In the future we might implement a build system that extracts relevant code snippets.

