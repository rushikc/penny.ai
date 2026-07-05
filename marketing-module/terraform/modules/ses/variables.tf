variable "sender_identity" {
  description = "Email address or domain to verify and use as the SES sender."
  type        = string
}

variable "create_configuration_set" {
  description = "Whether to create an SES configuration set for send/bounce metrics."
  type        = bool
  default     = true
}

variable "configuration_set_name" {
  description = "Name of the SES configuration set (when enabled)."
  type        = string
  default     = "screenstart-marketing"
}

variable "tags" {
  description = "Tags applied to created resources."
  type        = map(string)
  default     = {}
}
