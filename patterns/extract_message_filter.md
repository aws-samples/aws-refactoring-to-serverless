# Extract Message Filter 


## Description

In publish-subscribe model, if you have subscribers filtering out messsages based on data in then message, then we can extract that filtering logic from the consumers to EventBridge.

An example of consumer code might look like below:

```
exports.handler = async (event) => {
    const input = event.detail;
    
    //Name field should not be emtpy and location should be NYC.
    if (!input.name || input.location != 'NYC') {
        return
    } 
   
   ...
  
```

## Solution

1. For EventBridge: Use [Content filtering in Amazon EventBridge event patterns](https://aws.amazon.com/blogs/compute/reducing-custom-code-by-using-advanced-rules-in-amazon-eventbridge/) to extract the filtering of message from the Consumer code into EventBridge.  
The filtering logic can be placed in CDK or CloudFormation to make the application topology explicit.  
For a CDK example written in Typescript, please see [/code/message-filter](/code/message-filter).

2. If existing architecture is already using SNS, look at [SNS Filter Policy](https://docs.aws.amazon.com/sns/latest/dg/sns-message-filtering.html) to move out the filtering logic from the code.



## Considerations 

### Advantages
* Messaging Platform takes on the responsibility of filtering and the application code in the Consumer can focus on processing of message.
* Message Filtering now becomes declarative rather than hidden inside the Consumer code.

### Applicability
* In case of EventBridge: If an event does not match with the rule, message will be removed unnoticed. You can optionally archive all events delivered to an event bus. Archived events can be replayed at any time.
* In case of SNS: All the information needed for the filtering needs to added to [message attributes](https://docs.aws.amazon.com/sns/latest/dg/sns-message-attributes.html). Subscription filters dont act on the message (body, payload).

## Related Refactorings

