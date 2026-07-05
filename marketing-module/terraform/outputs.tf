output "api_invoke_url" {
  description = "Base invoke URL for the marketing API (append /users, /campaigns/broadcast, /users/onboard)."
  value       = module.api_gateway.invoke_url
}

output "contacts_table_name" {
  description = "DynamoDB contacts table name."
  value       = module.dynamodb.table_name
}

output "templates_bucket_name" {
  description = "S3 bucket holding the email templates."
  value       = module.s3.bucket_name
}

output "synced_templates" {
  description = "Template files synced into S3."
  value       = module.s3.synced_keys
}

output "ses_sender_identity" {
  description = "Configured SES sender identity."
  value       = module.ses.sender_identity
}

output "onboarding_state_machine_arn" {
  description = "ARN of the onboarding Step Functions state machine."
  value       = module.step_functions.state_machine_arn
}

output "lambda_functions" {
  description = "Names of the deployed Lambda functions."
  value = {
    list_users         = module.list_users.function_name
    trigger_submission = module.trigger_submission.function_name
    start_onboarding   = module.start_onboarding.function_name
    worker_send_email  = module.worker_send_email.function_name
  }
}
