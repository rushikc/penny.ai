terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Trust policy allowing Step Functions to assume the role.
data "aws_iam_policy_document" "assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "sfn" {
  name               = "${var.name}-role"
  assume_role_policy = data.aws_iam_policy_document.assume.json
  tags               = var.tags
}

# The state machine only needs to invoke the worker Lambda.
data "aws_iam_policy_document" "invoke" {
  statement {
    effect    = "Allow"
    actions   = ["lambda:InvokeFunction"]
    resources = [var.worker_function_arn, "${var.worker_function_arn}:*"]
  }
}

resource "aws_iam_role_policy" "invoke" {
  name   = "${var.name}-invoke-worker"
  role   = aws_iam_role.sfn.id
  policy = data.aws_iam_policy_document.invoke.json
}

# Onboarding drip: welcome email -> wait -> check first video -> branch.
locals {
  definition = jsonencode({
    Comment = "Screen Start onboarding drip campaign"
    StartAt = "SendWelcomeEmail"
    States = {
      SendWelcomeEmail = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = var.worker_function_arn
          Payload = {
            action   = "send_email"
            template = "onboarding_welcome.html"
            subject  = "Welcome to Screen Start"
            "recipient" = {
              "email.$"     = "$.email"
              "firstName.$" = "$.firstName"
            }
            attributes = {
              dashboard_url   = "${var.app_base_url}/dashboard"
              help_url        = "${var.app_base_url}/help"
              unsubscribe_url = "${var.app_base_url}/unsubscribe"
            }
          }
        }
        ResultPath = "$.welcomeResult"
        Next       = "WaitForActivation"
      }

      WaitForActivation = {
        Type    = "Wait"
        Seconds = var.wait_seconds
        Next    = "CheckFirstVideo"
      }

      CheckFirstVideo = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = var.worker_function_arn
          Payload = {
            action     = "check_first_video"
            "email.$"  = "$.email"
            "userId.$" = "$.userId"
          }
        }
        ResultPath = "$.checkResult"
        Next       = "HasRecordedFirstVideo"
      }

      HasRecordedFirstVideo = {
        Type = "Choice"
        Choices = [
          {
            Variable      = "$.checkResult.Payload.hasRecordedFirstVideo"
            BooleanEquals = true
            Next          = "OnboardingComplete"
          }
        ]
        Default = "SendActivationNudge"
      }

      SendActivationNudge = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = var.worker_function_arn
          Payload = {
            action   = "send_email"
            template = "continuous_update.html"
            subject  = "Ready to record your first video?"
            "recipient" = {
              "email.$"     = "$.email"
              "firstName.$" = "$.firstName"
            }
            attributes = {
              feature_title   = "Your studio is waiting"
              feature_body    = "You have not recorded your first video yet. Jump in and turn your first desktop recording into a polished, shareable video in minutes."
              feature_image   = "${var.app_base_url}/assets/email/first-video.png"
              changelog_url   = "${var.app_base_url}/dashboard"
              unsubscribe_url = "${var.app_base_url}/unsubscribe"
            }
          }
        }
        ResultPath = "$.nudgeResult"
        Next       = "OnboardingComplete"
      }

      OnboardingComplete = {
        Type = "Succeed"
      }
    }
  })
}

resource "aws_cloudwatch_log_group" "sfn" {
  name              = "/aws/states/${var.name}"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

resource "aws_sfn_state_machine" "onboarding" {
  name       = var.name
  role_arn   = aws_iam_role.sfn.arn
  definition = local.definition
  type       = "STANDARD"

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.sfn.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  tags = var.tags
}

# Allow the state machine to write to its log group.
data "aws_iam_policy_document" "logs" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogDelivery",
      "logs:GetLogDelivery",
      "logs:UpdateLogDelivery",
      "logs:DeleteLogDelivery",
      "logs:ListLogDeliveries",
      "logs:PutResourcePolicy",
      "logs:DescribeResourcePolicies",
      "logs:DescribeLogGroups",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "logs" {
  name   = "${var.name}-logs"
  role   = aws_iam_role.sfn.id
  policy = data.aws_iam_policy_document.logs.json
}
