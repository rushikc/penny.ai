variable "table_name" {
  description = "Name of the DynamoDB contacts table."
  type        = string
}

variable "tags" {
  description = "Tags applied to the table."
  type        = map(string)
  default     = {}
}
