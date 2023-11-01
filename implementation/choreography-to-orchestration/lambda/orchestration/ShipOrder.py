import json

def lambda_handler(event, context):
    # TODO implement
    print ('Shipped order for the product id:', event['product_id'])
    return {
        'statusCode': 200, 'order_shipped' : True, **event
    }

