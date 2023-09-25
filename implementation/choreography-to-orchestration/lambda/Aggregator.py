import boto3
from botocore.config import Config
import json
import os
import uuid

TABLE_NAME = os.environ['table_name']

config = Config(connect_timeout=5, read_timeout=5, retries={'max_attempts': 1})
dynamodb = boto3.client('dynamodb', config=config)

def lambda_handler(event, context):
    request = json.loads(event['Records'][0]['body'])
    unique_id = str(uuid.uuid4())

    response = dynamodb.put_item(
        TableName = TABLE_NAME, 
        Item = {
            'stock_id': {'S': str(request['stock-id'])},
            'quote' : {'S': request['quote']},
            'from': {'S': request['from']},
        }
    )

    return {
        'statusCode': 201,
        'body': json.dumps({
            "stock-id": request['stock-id']
        })
    }