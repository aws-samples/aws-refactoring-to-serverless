import boto3
from botocore.config import Config
import json
import os
import uuid

TABLE_NAME = os.environ['table_name']
config = Config(connect_timeout=5, read_timeout=5, retries={'max_attempts': 1})
dynamodb = boto3.client('dynamodb', config=config)
sns = boto3.client('sns')

def lambda_handler(event, context):
    
    request = json.loads(event['Records'][0]['Sns']['Message'])
    
    data = dynamodb.get_item(
    TableName=TABLE_NAME,
    Key={
        'product_id': {
          'S': str(request['product_id'])
        }
    },
    ProjectionExpression = "Ship_order")
  
    ship_order = json.dumps(data['Item']['Ship_order'] ['BOOL'])
    
    if(ship_order is 'true'):
        dynamodb_response = dynamodb.put_item(
        TableName = TABLE_NAME, 
        Item = {
            'product_id': {'S': str(request['product_id'])},
            'Payment_processed' : {'BOOL': True},
            'Ship_order' : {'BOOL': True},
            'Update_reward' : {'BOOL': True}
        });
    
        print('sns_response:', sns_response)
    else:
        print(' Error: Ship order error')
        
    return
