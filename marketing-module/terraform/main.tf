terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.tags
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  name_prefix   = "${var.project}-${var.environment}"
  templates_dir = "${path.module}/../templates"
  backend_dir   = "${path.module}/../backend"

  # Bucket names are globally unique; suffix with account id.
  templates_bucket = "${local.name_prefix}-templates-${data.aws_caller_identity.current.account_id}"
  contacts_table   = "${local.name_prefix}-contacts"

  broadcast_template = "new_submission_broadcast.html"

  tags = merge({
    Project     = var.project
    Environment = var.environment
    Module      = "marketing"
    ManagedBy   = "terraform"
  }, var.tags)
}

# --------------------------------------------------------------------------
# Data stores & identities
# --------------------------------------------------------------------------
module "dynamodb" {
  source     = "./modules/dynamodb"
  table_name = local.contacts_table
  tags       = local.tags
}

module "s3" {
  source        = "./modules/s3"
  bucket_name   = local.templates_bucket
  templates_dir = local.templates_dir
  tags          = local.tags
}

module "ses" {
  source                 = "./modules/ses"
  sender_identity        = var.ses_sender_identity
  configuration_set_name = "${local.name_prefix}-cfg"
  tags                   = local.tags
}

# --------------------------------------------------------------------------
# Lambda functions
# --------------------------------------------------------------------------

# Core worker: renders S3 templates and sends via SES. Also answers the
# "check first video" query for the onboarding state machine.
module "worker_send_email" {
  source        = "./modules/lambda"
  function_name = "${local.name_prefix}-worker-send-email"
  source_dir    = "${local.backend_dir}/worker_send_email"

  environment = {
    TEMPLATES_BUCKET = module.s3.bucket_name
    SES_SENDER       = module.ses.sender_identity
    USERS_TABLE      = module.dynamodb.table_name
  }

  extra_policy_statements = [
    {
      sid       = "ReadTemplates"
      effect    = "Allow"
      actions   = ["s3:GetObject"]
      resources = ["${module.s3.bucket_arn}/*"]
    },
    {
      sid       = "SendEmail"
      effect    = "Allow"
      actions   = ["ses:SendEmail", "ses:SendRawEmail"]
      resources = ["*"]
    },
    {
      sid       = "ReadContacts"
      effect    = "Allow"
      actions   = ["dynamodb:GetItem", "dynamodb:Query"]
      resources = [module.dynamodb.table_arn, "${module.dynamodb.table_arn}/index/*"]
    },
  ]

  tags = local.tags
}

# GET /users -> list contacts.
module "list_users" {
  source        = "./modules/lambda"
  function_name = "${local.name_prefix}-list-users"
  source_dir    = "${local.backend_dir}/list_users"

  environment = {
    USERS_TABLE = module.dynamodb.table_name
  }

  extra_policy_statements = [
    {
      sid       = "ScanContacts"
      effect    = "Allow"
      actions   = ["dynamodb:Scan", "dynamodb:Query"]
      resources = [module.dynamodb.table_arn, "${module.dynamodb.table_arn}/index/*"]
    },
  ]

  tags = local.tags
}

# POST /campaigns/broadcast -> query segment + fan out to the worker.
module "trigger_submission" {
  source        = "./modules/lambda"
  function_name = "${local.name_prefix}-trigger-submission"
  source_dir    = "${local.backend_dir}/trigger_submission"

  environment = {
    USERS_TABLE        = module.dynamodb.table_name
    WORKER_FUNCTION    = module.worker_send_email.function_name
    BROADCAST_TEMPLATE = local.broadcast_template
  }

  extra_policy_statements = [
    {
      sid       = "ScanContacts"
      effect    = "Allow"
      actions   = ["dynamodb:Scan", "dynamodb:Query"]
      resources = [module.dynamodb.table_arn, "${module.dynamodb.table_arn}/index/*"]
    },
    {
      sid       = "InvokeWorker"
      effect    = "Allow"
      actions   = ["lambda:InvokeFunction"]
      resources = [module.worker_send_email.function_arn, "${module.worker_send_email.function_arn}:*"]
    },
  ]

  tags = local.tags
}

# POST /users/onboard -> start the onboarding state machine.
module "start_onboarding" {
  source        = "./modules/lambda"
  function_name = "${local.name_prefix}-start-onboarding"
  source_dir    = "${local.backend_dir}/start_onboarding"

  environment = {
    ONBOARDING_STATE_MACHINE_ARN = module.step_functions.state_machine_arn
  }

  extra_policy_statements = [
    {
      sid       = "StartOnboarding"
      effect    = "Allow"
      actions   = ["states:StartExecution"]
      resources = [module.step_functions.state_machine_arn]
    },
  ]

  tags = local.tags
}

# --------------------------------------------------------------------------
# Orchestration
# --------------------------------------------------------------------------
module "step_functions" {
  source              = "./modules/step_functions"
  name                = "${local.name_prefix}-onboarding"
  worker_function_arn = module.worker_send_email.function_arn
  app_base_url        = var.app_base_url
  wait_seconds        = var.onboarding_wait_seconds
  tags                = local.tags
}

# --------------------------------------------------------------------------
# API Gateway
# --------------------------------------------------------------------------
module "api_gateway" {
  source     = "./modules/api_gateway"
  api_name   = "${local.name_prefix}-api"
  stage_name = "v1"

  routes = {
    "GET /users" = {
      lambda_invoke_arn    = module.list_users.invoke_arn
      lambda_function_name = module.list_users.function_name
    }
    "POST /campaigns/broadcast" = {
      lambda_invoke_arn    = module.trigger_submission.invoke_arn
      lambda_function_name = module.trigger_submission.function_name
    }
    "POST /users/onboard" = {
      lambda_invoke_arn    = module.start_onboarding.invoke_arn
      lambda_function_name = module.start_onboarding.function_name
    }
  }

  tags = local.tags
}
