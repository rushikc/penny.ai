terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Verified sender identity used as the "From" address by worker_send_email.
# `identity` may be a full email address (e.g. hello@screenstart.app) or a
# domain (e.g. screenstart.app). Verification must be completed out-of-band
# (email click-through or DNS records for a domain identity).
resource "aws_sesv2_email_identity" "sender" {
  email_identity = var.sender_identity
  tags           = var.tags
}

# Optional configuration set to capture sends, bounces, and complaints.
resource "aws_sesv2_configuration_set" "this" {
  count                  = var.create_configuration_set ? 1 : 0
  configuration_set_name = var.configuration_set_name

  reputation_options {
    reputation_metrics_enabled = true
  }

  sending_options {
    sending_enabled = true
  }

  tags = var.tags
}
