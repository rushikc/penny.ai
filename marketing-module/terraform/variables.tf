variable "aws_region" {
  description = "AWS region to deploy the marketing module into."
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project/name prefix for all resources."
  type        = string
  default     = "screenstart-marketing"
}

variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "ses_sender_identity" {
  description = "Email address or domain used as the SES sender (must be verified in SES)."
  type        = string
  default     = "hello@screenstart.app"
}

variable "app_base_url" {
  description = "Base URL of the Screen Start app, used to build links inside emails."
  type        = string
  default     = "https://screenstart.app"
}

variable "onboarding_wait_seconds" {
  description = "Delay after the welcome email before checking first-video activation."
  type        = number
  default     = 172800 # 2 days
}

variable "tags" {
  description = "Common tags applied to all resources."
  type        = map(string)
  default     = {}
}
