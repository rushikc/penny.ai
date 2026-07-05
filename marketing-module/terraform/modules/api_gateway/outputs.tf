output "api_id" {
  description = "ID of the HTTP API."
  value       = aws_apigatewayv2_api.this.id
}

output "api_endpoint" {
  description = "Base invoke URL of the HTTP API (without stage)."
  value       = aws_apigatewayv2_api.this.api_endpoint
}

output "invoke_url" {
  description = "Full invoke URL including the deployment stage."
  value       = "${aws_apigatewayv2_api.this.api_endpoint}/${aws_apigatewayv2_stage.this.name}"
}
