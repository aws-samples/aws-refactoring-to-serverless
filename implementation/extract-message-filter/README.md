# Extract message filter
This project is the CDK implementation of ['Extract message filter'](https://github.com/aws-samples/aws-refactoring-to-serverless/blob/main/patterns/extract-message-filter.md) pattern. This patterns shows how you can reduce your application code by extracting message filter code and utilizing Amazon EventBridge rules instead.


## How it works
THe application is configured to receive S3 notifications every time a file is uploaded to the S3 bucket. Messages are filtered and routed to various lambda functions based on file metadata.

The code will deploy 2 versions of this application:
- extract-message-filter-original: The lambda code (router) in this version routes events to either the claim processor or the media processor lambda functions based on the S3 file prefix (/media or /claims) as well as the default processor lambda function.
- extract-message-refactored: The router lambda code is replaced by EventBridge rules. The three EventBridge rules provide the same functionality as the router lambda function.

---
## Deploy the applications

To build this app, navigate to `implementation/extract-message-filter` folder. Then run the following:

```bash
npm install -g aws-cdk
npm install
npm run build
```

This will install the necessary CDK, dependencies, build your TypeScript files and CloudFormation template.

Next, deploy the 2 Stacks to your AWS Account.
``` 
cdk deploy --all
```

## Testing

Upload a file to the S3 bucket created in the original stack:
``` 
BUCKET_ORIGINAL=$(aws cloudformation describe-stacks --stack-name ExtractMessageFilterOriginalStack --query Stacks[].Outputs[0].OutputValue --output text)
echo $BUCKET_ORIGINAL
aws s3 cp <filename> s3://$BUCKET_ORIGINAL/media/<filename>
```

Navigate to CloudWatch and check the router (/aws/lambda/Router log group) lambda function execution logs, you should see the following:

```bash
INFO Invoked default processor lambda function
INFO Invoked media processor lambda function.
```

The router lambda function processed the event and routed it to both the default and the media processors. Check the logs of the media (/aws/lambda/MediaProcessorOriginal log group) and the default processor (/aws/lambda/DefaultProcessorOriginal log group) lambda functions: 

```json
{
    "eventSource": "aws:s3",
    "s3": {
        "bucket": {
            "name": "<original bucket name>"
        },
        "object": {
            "key": "media/<filename>",
        }
    }
}
```

Upload one more file:

``` bash
aws s3 cp <filename> s3://$BUCKET_ORIGINAL/claims/<filename>
```

Check the router lambda function logs again, you should see:

```bash
INFO Invoked default processor lambda function
INFO Invoked claims processor lambda function
```

This time the router lambda function sent the event to the claim and the default processors lambda functions, if you check the logs (/aws/lambda/ClaimProcessorOriginal and /aws/lambda/DefaultProcessorOriginal log groups), you should see the following output:
```json
{
    "eventSource": "aws:s3",
    "s3": {
        "bucket": {
            "name": "<original bucket name>"
        },
        "object": {
            "key": "claims/<filename>",
        }
    }
}
```

Now, let's take a look at the refactored stack. Upload a file to the S3 bucket in the refactored stack:

```bash
BUCKET_REFACTORED=$(aws cloudformation describe-stacks --stack-name ExtractMessageFilterRefactoredStack --query Stacks[].Outputs[0].OutputValue --output text)
echo $BUCKET_REFACTORED
aws s3 cp <filename> s3://$BUCKET_REFACTORED/claims/<filename>
```

The refactored stack does not have the router lambda function. The other lambda functions are invoked the same way. Check the logs of the claim (/aws/lambda/ClaimProcessorRefactored log group) and the default processor (/aws/lambda/DefaultProcessorRefactored log group) lambda functions: 

```json
{
    "eventSource": "aws:s3",
    "s3": {
        "bucket": {
            "name": "<refactored bucket name>"
        },
        "object": {
            "key": "claims/<filename>",
        }
    }
}
```

Upload one more file:

```bash
aws s3 cp <filename> s3://$BUCKET_REFACTORED/media/<filename>
```

This time the media processor (/aws/lambda/MediaProcessorRefactored log group) lambda function is invoked along with the default processor lambda function, check the logs and you should see the following:

```json
{
    "eventSource": "aws:s3",
    "s3": {
        "bucket": {
            "name": "<refactored bucket name>"
        },
        "object": {
            "key": "media/<filename>",
        }
    }
}
```

## Cleanup

```bash
cdk destroy --all
```
