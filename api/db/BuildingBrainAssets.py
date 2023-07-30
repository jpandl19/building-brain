from botocore.exceptions import BotoCoreError, ClientError
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import boto3
from boto3.dynamodb.conditions import Key, Attr
import uuid
import json
import os
# AWS credentials and region configuration
aws_access_key_id = os.getenv("AWS_ACCESS_KEY_2")
aws_secret_access_key = os.getenv("AWS_SECRET_KEY_2")
region_name = os.getenv("AWS_REGION", 'us-east-1')
BUCKET_NAME = os.getenv("BUCKET_NAME", 'building-brain-custom-files')



TABLE_NAME = 'BuildingBrainAssets'
# Initialize a DynamoDB client
dynamodb = boto3.resource(
    'dynamodb',
    aws_access_key_id=aws_access_key_id,
    aws_secret_access_key=aws_secret_access_key,
    region_name=region_name
)

# Initialize a DynamoDB client
# s3 = boto3.resource(
#     's3',
#     aws_access_key_id=aws_access_key_id,
#     aws_secret_access_key=aws_secret_access_key,
#     region_name=region_name
# )

def insert_base_data(data): 
    orgId = str(uuid.uuid4())
    for item in data:
        # Convert all keys in the item to camelCase
        item = {(key.lower()): str(value) for key, value in item.items()}
        # Add 'orgId' property to the item
        item['orgId'] = orgId

        # Put the item into the DynamoDB table
        table.put_item(Item=item)

def get_s3_client():
    # Please replace with your own credentials
    s3 = boto3.client('s3',
                      aws_access_key_id=aws_access_key_id,
                      aws_secret_access_key=aws_secret_access_key,
                      )

    s3 = boto3.client('s3')
    return s3


s3 = get_s3_client()

table = dynamodb.Table(TABLE_NAME)


def process_file(file, filename, email, platformId):
    if file and (file.filename.endswith('.pdf') or file.filename.endswith('.txt')):
        filename = secure_filename(filename)
        # generate unique id for the file
        file_id = str(uuid.uuid4())
        # create file path for s3
        s3_file_path = file_id
        # upload file to s3
        s3.upload_fileobj(file, BUCKET_NAME, s3_file_path)

        # url for the uploaded file
        s3_url = f'https://{BUCKET_NAME}.s3.amazonaws.com/{s3_file_path}'
        record = {
            'id': file_id,
            'url': s3_url,
            'filename': filename,
            'platformId': platformId,
            'email': email,
            "embedded": False,
            "active": True,
            # 'orgId': org_id
        }
        # create a record in dynamodb
        table.put_item(
            Item=record
        )

        return record

    return None


def get_item_by_id(id):
    try:
        response = table.get_item(
            Key={
                'id': id
            }
        )
        return response['Item']
    except ClientError as e:
        print(e.response['Error']['Message'])
        return None


def get_items_by_email(email):
    try:
        response = table.query(
            IndexName='email-index',
            KeyConditionExpression=Key('email').eq(email)
        )
        return response['Items']
    except ClientError as e:
        print(e.response['Error']['Message'])
        return None
    
def get_all_assets():
    try:
        response = table.scan()
        return response['Items']
    except ClientError as e:
        print(e.response['Error']['Message'])
        return None


def update_filename(id, new_filename):
    secure_new_filename = secure_filename(new_filename)
    try:
        table.update_item(
            Key={
                'id': id
            },
            UpdateExpression="set filename=:f",
            ExpressionAttributeValues={
                ':f': secure_new_filename
            },
            ReturnValues="UPDATED_NEW"
        )
    except ClientError as e:
        print(e.response['Error']['Message'])

def update_item_by_id(fileId, file_record):
    table.update_item(
        Key={
            'id': fileId  # assuming 'id' is the primary key in your table
        },
        UpdateExpression='SET embedded = :val1',
        ExpressionAttributeValues={
            ':val1': file_record['embedded']
        }
    )

def delete_file(id):
    try:
        # Get the file item from DynamoDB
        file_item = get_item_by_id(id)
        if not file_item:
            print(f"No file found with id {id}")
            return

        # Extract the file path from the url
        # file_path = file_item['url'].split(
            # f"{s3.meta.endpoint_url}/{BUCKET_NAME}/")[1]

        # Delete the file from S3
        s3.delete_object(Bucket=BUCKET_NAME, Key=id)

        # Delete the item from DynamoDB
        table.delete_item(
            Key={
                'id': id
            }
        )

        return True
    except ClientError as e:
        print(e.response['Error']['Message'])
        raise e
    except BotoCoreError as e:
        print(e)
        raise e


def create_s3_bucket(bucket_name, passed_region_name=region_name):
    try:

        if region_name == 'us-east-1':
            s3.create_bucket(
                Bucket=bucket_name.strip().lower(),
                ACL='private',
            )
        else:
            # Create the S3 bucket with a private ACL
            s3.create_bucket(
                Bucket=bucket_name.strip().lower(),
                ACL='private',
                CreateBucketConfiguration={
                    'LocationConstraint': passed_region_name
                }
            )
        print(f"Bucket {bucket_name} created successfully")
    except ClientError as e:
        print(e.response['Error']['Message'])

def create_table():
    # Create the DynamoDB table.
    table = dynamodb.create_table(
        TableName=TABLE_NAME,
        KeySchema=[
            {
                'AttributeName': 'id',
                'KeyType': 'HASH'
            },
        ],
        AttributeDefinitions=[
            {
                'AttributeName': 'id',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'email',
                'AttributeType': 'S'
            },
        ],
        ProvisionedThroughput={
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        },
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'email-index',
                'KeySchema': [
                    {
                        'AttributeName': 'email',
                        'KeyType': 'HASH'
                    },
                ],
                'Projection': {
                    'ProjectionType': 'ALL',
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5,
                }
            },
        ]
    )

def load_and_insert_data(file_path="training/training_data/raw_building_data.json"):
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
            
            # Check if data is a list and contains dictionaries
            if isinstance(data, list) and all(isinstance(item, dict) for item in data):
                    insert_base_data(data)
            else:
                print("Invalid data format. Expected a list of dictionaries.")
    except FileNotFoundError:
        print(f"{file_path} not found.")
    except json.JSONDecodeError:
        print(f"Error decoding JSON from {file_path}")

if __name__ == '__main__':
    pass;
    # load_and_insert_data()
    # create_table()