# Extract message router
This project is the CDK implementation of ['Extract Message Router'](https://github.com/aws-samples/aws-refactoring-to-serverless/blob/main/patterns/extract-message-router.md) pattern. This patterns shows how you can reduce your application code by extracting message routing code and utilizing Amazon EventBridge rules instead.


## How it works
THe application is configured to receive S3 notifications every time a file is uploaded to the S3 bucket.
Depending on where the file is uploaded, under prefix '/media' or '/claims', messages is routed to appropriate lambda function.

The code will deploy 2 versions of this application:
- extract-message-router-original: The lambda code (router) in this version routes events to either the claim processor or the media processor lambda functions based on the S3 file prefix (/media or /claims) as well as the default processor lambda function.
- extract-message-refactored: The router lambda code is replaced by EventBridge rules. The three EventBridge rules provide the same functionality as the router lambda function.

---
## Deploy the applications

To build this app, navigate to `implementation/extract-message-router` folder. Then run the following:

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

1. Get any media file (content does not matter) for testing this pattern.

2. Next, lets upload that file to the 'media' folder. Remember to r7.eplace {your_filename} with name of your file.
``` 
BUCKET_ORIGINAL=$(aws cloudformation describe-stacks --stack-name ExtractMessageRouterOriginalStack --query 'Stacks[].Outputs[0].OutputValue' --output text)
aws s3 cp <your_filename> s3://$BUCKET_ORIGINAL/media/<your_filename>
```

3. Login to your AWS Console. 

4. Navigate to CloudWatch. Ensure you are in correct AWS Region.

5. From left navigation, pick Logs > Log Group.  Checkout the router lambda function execution logs (/aws/lambda/Router), you should see the following:

```bash
INFO Invoked default processor lambda function
INFO Invoked media processor lambda function.
```

The Router lambda function processed the event and routed it to both the default and the media processors. 

6. Now, lets check the logs of the media (/aws/lambda/MediaProcessorOriginal log group) 
You should see log entry
```
{
    "eventSource": "aws:s3",
    "s3": {
        "bucket": {
            "name": "<$BUCKET_ORIGINAL>"
        },
        "object": {
            "key": "media/<your_filename>",
        }
    }
}
```

7. Now lets upload one more file to 'claims'. 

``` bash
aws s3 cp <your_filename> s3://$BUCKET_ORIGINAL/claims/<your_filename>
```

8. In CloudWatch console, goto Logs > Log Group.  Checkout the router lambda function execution logs again(/aws/lambda/Router), you should see the following:

```bash
INFO Invoked default processor lambda function
INFO Invoked claims processor lambda function
```

9. This time the Router lambda function sent the event to the claim and the default processors lambda functions, if you check the logs (/aws/lambda/ClaimProcessorOriginal)
You should see log entry
```
{
    "eventSource": "aws:s3",
    "s3": {
        "bucket": {
            "name": "<$BUCKET_ORIGINAL>"
        },
        "object": {
            "key": "claims/<your_filename>",
        }
    }
}
```


10. Now we will test this behavior in the refactored stack. 

11. Upload your test file to the '/claims' prefix in the refactored stack:

```bash
BUCKET_REFACTORED=$(aws cloudformation describe-stacks --stack-name ExtractMessageRouterRefactoredStack --query 'Stacks[].Outputs[0].OutputValue' --output text)
aws s3 cp <filename> s3://$BUCKET_REFACTORED/claims/<filename>
```

12. The refactored stack does not have the router lambda function. EventBridge will route the event to claim.
To verify that it was invoked, lets open the log>log group /aws/lambda/ClaimProcessorRefactored

```json
{
    "eventSource": "aws:s3",
    "s3": {
        "bucket": {
            "name": "<$BUCKET_REFACTORED>"
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
            "name": "<$BUCKET_REFACTORED>"
        },
        "object": {
            "key": "media/<filename>",
        }
    }
}
```

Conclusion: The refactored stack preserved the behavior

## Cleanup

Empty the buckets and destroy the stacks:

```bash
aws s3 rm s3://$BUCKET_ORIGINAL --recursive
aws s3 rm s3://$BUCKET_REFACTORED --recursive

cdk destroy --all
```
