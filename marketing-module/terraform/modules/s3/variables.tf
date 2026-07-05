variable "bucket_name" {
  description = "Name of the S3 bucket that stores email templates."
  type        = string
}

variable "templates_dir" {
  description = "Local path to the folder containing the HTML templates to sync."
  type        = string
}

variable "tags" {
  description = "Tags applied to created resources."
  type        = map(string)
  default     = {}
}
