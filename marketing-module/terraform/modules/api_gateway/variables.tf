variable "api_name" {
  description = "Name of the HTTP API."
  type        = string
}

variable "stage_name" {
  description = "Deployment stage name."
  type        = string
  default     = "v1"
}

variable "routes" {
  description = "Map of route keys (e.g. \"GET /users\") to the backing Lambda's invoke ARN and function name."
  type = map(object({
    lambda_invoke_arn    = string
    lambda_function_name = string
  }))
}

variable "cors_allow_origins" {
  description = "Allowed CORS origins."
  type        = list(string)
  default     = ["*"]
}

variable "log_retention_days" {
  description = "CloudWatch retention for API access logs."
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags applied to created resources."
  type        = map(string)
  default     = {}
}
