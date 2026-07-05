output "function_name" {
  description = "Name of the Lambda function."
  value       = aws_lambda_function.this.function_name
}

output "function_arn" {
  description = "ARN of the Lambda function."
  value       = aws_lambda_function.this.arn
}

output "invoke_arn" {
  description = "Invoke ARN used by API Gateway integrations."
  value       = aws_lambda_function.this.invoke_arn
}

output "role_name" {
  description = "Name of the function's execution role."
  value       = aws_iam_role.this.name
}

output "role_arn" {
  description = "ARN of the function's execution role."
  value       = aws_iam_role.this.arn
}
