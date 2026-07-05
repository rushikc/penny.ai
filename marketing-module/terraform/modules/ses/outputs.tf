output "sender_identity" {
  description = "The configured SES sender identity."
  value       = aws_sesv2_email_identity.sender.email_identity
}

output "sender_arn" {
  description = "ARN of the SES sender identity."
  value       = aws_sesv2_email_identity.sender.arn
}

output "configuration_set_name" {
  description = "Name of the SES configuration set, if created."
  value       = var.create_configuration_set ? aws_sesv2_configuration_set.this[0].configuration_set_name : null
}
