import boto3
from botocore.config import Config
import json
import os
import random
import time

queue_url = os.environ.get('queue_url')
function_name = os.environ.get('AWS_LAMBDA_FUNCTION_NAME')

config = Config(connect_timeout=5, read_timeout=5, retries={'max_attempts': 1})
sqs = boto3.client('sqs', config=config)

def lambda_handler(event, context):
    message = event
    send_to_queue = False
    if("stock-id" not in event.keys()):
        message = json.loads(event['Records'][0]['Sns']['Message'])
        send_to_queue = True
        
    stock_id = message['stock-id']
    response_message = json.dumps({
        'stock-id': stock_id,
        'quote': 'sell' if stock_id % 2 == 0 else 'buy',
        'from' : function_name
    })
    
   # send the response to the stock response queue only when the message is from SNS topic
    if(send_to_queue):
        response = sqs.send_message(
        QueueUrl = queue_url,
        MessageBody = response_message)
        print('sent SQS message: {}'.format(response_message))
    
    return json.loads(response_message)