# Copy to terraform.tfvars (or pass with -var-file) and adjust for your account.
aws_region              = "us-east-1"
project                 = "screenstart-marketing"
environment             = "dev"
ses_sender_identity     = "hello@screenstart.app"
app_base_url            = "https://screenstart.app"
onboarding_wait_seconds = 172800 # 2 days

tags = {
  Owner = "growth-team"
}
