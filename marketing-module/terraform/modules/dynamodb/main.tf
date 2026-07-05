terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Contacts / users table for the marketing module.
# Primary key: userId (hash). A global secondary index on `email` lets us look
# up a contact by email address (used by worker_send_email check_first_video).
resource "aws_dynamodb_table" "contacts" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = var.tags
}
