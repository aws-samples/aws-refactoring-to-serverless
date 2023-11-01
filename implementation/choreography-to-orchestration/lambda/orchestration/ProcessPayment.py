import json

def lambda_handler(event, context):
    # TODO implement
    print ('Processing payment for the product id:', event['product_id'])
    return {
        'statusCode': 200, 'payment_processed' : True, **event
    }
