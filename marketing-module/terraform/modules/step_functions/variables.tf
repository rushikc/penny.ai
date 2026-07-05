variable "name" {
  description = "Name of the onboarding state machine."
  type        = string
}

variable "worker_function_arn" {
  description = "ARN of the worker_send_email Lambda invoked by the state machine."
  type        = string
}

variable "app_base_url" {
  description = "Base URL of the Screen Start app, used to build links in emails."
  type        = string
  default     = "https://screenstart.app"
}

variable "wait_seconds" {
  description = "How long to wait after the welcome email before checking first-video activation."
  type        = number
  default     = 172800 # 2 days
}

variable "log_retention_days" {
  description = "CloudWatch log retention for state machine logs."
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags applied to created resources."
  type        = map(string)
  default     = {}
}
