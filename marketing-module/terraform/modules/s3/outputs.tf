output "bucket_name" {
  description = "Name of the templates bucket."
  value       = aws_s3_bucket.templates.id
}

output "bucket_arn" {
  description = "ARN of the templates bucket."
  value       = aws_s3_bucket.templates.arn
}

output "synced_keys" {
  description = "List of template keys synced into the bucket."
  value       = [for o in aws_s3_object.template : o.key]
}
