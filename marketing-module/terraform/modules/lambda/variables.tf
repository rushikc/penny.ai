variable "function_name" {
  description = "Name of the Lambda function."
  type        = string
}

variable "source_dir" {
  description = "Absolute or relative path to the folder containing the Lambda source and dependencies."
  type        = string
}

variable "handler" {
  description = "Lambda handler entrypoint."
  type        = string
  default     = "index.handler"
}

variable "runtime" {
  description = "Lambda runtime."
  type        = string
  default     = "nodejs20.x"
}

variable "timeout" {
  description = "Function timeout in seconds."
  type        = number
  default     = 30
}

variable "memory_size" {
  description = "Function memory in MB."
  type        = number
  default     = 256
}

variable "environment" {
  description = "Environment variables passed to the function."
  type        = map(string)
  default     = {}
}

variable "extra_policy_statements" {
  description = "Additional IAM policy statements attached to the function role (least-privilege access to DynamoDB, S3, SES, Lambda, Step Functions, etc.)."
  type = list(object({
    sid       = optional(string)
    effect    = string
    actions   = list(string)
    resources = list(string)
  }))
  default = []
}

variable "tags" {
  description = "Tags applied to created resources."
  type        = map(string)
  default     = {}
}
