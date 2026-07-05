terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Private bucket holding the raw HTML email templates.
resource "aws_s3_bucket" "templates" {
  bucket = var.bucket_name
  tags   = var.tags
}

resource "aws_s3_bucket_public_access_block" "templates" {
  bucket                  = aws_s3_bucket.templates.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "templates" {
  bucket = aws_s3_bucket.templates.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "templates" {
  bucket = aws_s3_bucket.templates.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Automatically sync every HTML template from the local templates/ folder into
# the bucket. New/changed files are re-uploaded on `terraform apply` because the
# object etag tracks the file's md5.
resource "aws_s3_object" "template" {
  for_each = fileset(var.templates_dir, "*.html")

  bucket       = aws_s3_bucket.templates.id
  key          = each.value
  source       = "${var.templates_dir}/${each.value}"
  etag         = filemd5("${var.templates_dir}/${each.value}")
  content_type = "text/html"

  tags = var.tags
}
