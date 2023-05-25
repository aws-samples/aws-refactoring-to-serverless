import boto3
import json
import logging
import uuid

logger = logging.getLogger()
logger.setLevel(logging.INFO)
dynamo = boto3.resource('dynamodb')

def lambda_handler(event, context):
  for record in event['Records']:
    body = json.loads(record['body'])
    quote = body['responsePayload']
    bankId = quote['bankId']
    rate = quote['rate']
    table = dynamo.Table('MortgageQuotes')
    item = { 'ID': str(uuid.uuid4()), 'bankId': bankId, 'rate':"%.2f" % rate } 
    logger.info(item)
    table.put_item(Item = item)
  return 0
