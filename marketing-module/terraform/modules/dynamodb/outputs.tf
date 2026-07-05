output "table_name" {
  description = "Name of the contacts table."
  value       = aws_dynamodb_table.contacts.name
}

output "table_arn" {
  description = "ARN of the contacts table."
  value       = aws_dynamodb_table.contacts.arn
}

output "table_arn_wildcard" {
  description = "ARN pattern covering the table and its indexes (for IAM policies)."
  value       = "${aws_dynamodb_table.contacts.arn}*"
}
