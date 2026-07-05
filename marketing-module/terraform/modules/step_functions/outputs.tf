output "state_machine_arn" {
  description = "ARN of the onboarding state machine."
  value       = aws_sfn_state_machine.onboarding.arn
}

output "state_machine_name" {
  description = "Name of the onboarding state machine."
  value       = aws_sfn_state_machine.onboarding.name
}

output "role_arn" {
  description = "ARN of the state machine execution role."
  value       = aws_iam_role.sfn.arn
}
