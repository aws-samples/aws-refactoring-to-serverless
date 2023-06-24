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
    logger.info(quote)
    requestId = quote['id']
    bankId = quote['bankId']
    rate = quote['rate']
    table = dynamo.Table('MortgageQuotes')
    
    record = table.get_item(Key={'ID': quote['id'] }, ConsistentRead=True)
    item = record.get('Item', { 'ID': quote['id'], 'Quotes': [] } )
    item['Quotes'].append( { 'bankId': quote['bankId'], 'rate':"%.2f" % quote['rate'] }) 
    
    logger.info(item)
    table.put_item(Item = item)
  return 0
