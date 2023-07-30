from botocore.exceptions import BotoCoreError, ClientError
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import boto3
from boto3.dynamodb.conditions import Key, Attr
import uuid
import os
import json
# AWS credentials and region configuration
aws_access_key_id = os.getenv("AWS_ACCESS_KEY")
aws_secret_access_key = os.getenv("AWS_SECRET_KEY")
region_name = os.getenv("AWS_REGION", 'us-east-1')
BUCKET_NAME = os.getenv("BUCKET_NAME", 'building-brain-custom-files')

TABLE_NAME = 'BuildingBrainCustomFiles'
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


def get_s3_client():
    # Please replace with your own credentials
    s3 = boto3.client('s3',
                      aws_access_key_id=aws_access_key_id,
                      aws_secret_access_key=aws_secret_access_key,
                      region_name=region_name
                      )
    return s3


s3 = get_s3_client()

table = dynamodb.Table(TABLE_NAME)

def create_presigned_url(object_name, bucket_name=BUCKET_NAME, expiration=3600):
    """
    Generate a presigned URL to share an S3 object

    :param bucket_name: string
    :param object_name: string
    :param expiration: Time in seconds for the presigned URL to remain valid
    :return: Presigned URL as string. If error, returns None.
    """

    # Generate a presigned URL for the S3 object
    try:
        response = s3.generate_presigned_url('get_object',
                                              Params={'Bucket': bucket_name,
                                                      'Key': object_name},
                                              ExpiresIn=expiration)
    except ClientError as e:
        print(e)
        return None

    # The response contains the presigned URL
    return response


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


def get_all_files():
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


if __name__ == '__main__':
    pass
    # create_table()
    # make_bucket_files_public(BUCKET_NAME)
    # create_presigned_url("00858c57-3215-428b-8f35-2c5aa556e05a")
