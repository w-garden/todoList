#!/bin/bash
set -e

echo "=== 1. Gradle 빌드 ==="
./gradlew buildZip

echo "=== 2. SAM 배포 ==="
sam deploy \
  --template-file template.yaml \
  --stack-name todo-app \
  --capabilities CAPABILITY_IAM \
  --region ap-northeast-2 \
  --resolve-s3

echo "=== 배포 완료 ==="
echo "Outputs:"
aws cloudformation describe-stacks \
  --stack-name todo-app \
  --region ap-northeast-2 \
  --query 'Stacks[0].Outputs' \
  --output table
