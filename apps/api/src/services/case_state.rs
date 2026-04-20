// Case State Machine for PR-07
// Defines case status and business type enums

use serde::{Deserialize, Serialize};

/// Case business type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CaseBizType {
    Enforcement,
    Deposit,
}

impl CaseBizType {
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "ENFORCEMENT" => Some(Self::Enforcement),
            "DEPOSIT" => Some(Self::Deposit),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Enforcement => "ENFORCEMENT",
            Self::Deposit => "DEPOSIT",
        }
    }
}

/// Case status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CaseStatus {
    // ENFORCEMENT states
    Created,
    UnderReview,
    WaitingVideo,
    WaitingSign,
    WaitingApproval,
    Approved,
    Issued,
    Closed,
    Voided,
    // DEPOSIT states
    WaitingDepositConfirm,
    Deposited,
    NoticePending,
    ReadyForClaim,
    Claimed,
}

impl CaseStatus {
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "CREATED" => Some(Self::Created),
            "UNDER_REVIEW" => Some(Self::UnderReview),
            "WAITING_VIDEO" => Some(Self::WaitingVideo),
            "WAITING_SIGN" => Some(Self::WaitingSign),
            "WAITING_APPROVAL" => Some(Self::WaitingApproval),
            "APPROVED" => Some(Self::Approved),
            "ISSUED" => Some(Self::Issued),
            "CLOSED" => Some(Self::Closed),
            "VOIDED" => Some(Self::Voided),
            "WAITING_DEPOSIT_CONFIRM" => Some(Self::WaitingDepositConfirm),
            "DEPOSITED" => Some(Self::Deposited),
            "NOTICE_PENDING" => Some(Self::NoticePending),
            "READY_FOR_CLAIM" => Some(Self::ReadyForClaim),
            "CLAIMED" => Some(Self::Claimed),
            _ => None,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Created => "CREATED",
            Self::UnderReview => "UNDER_REVIEW",
            Self::WaitingVideo => "WAITING_VIDEO",
            Self::WaitingSign => "WAITING_SIGN",
            Self::WaitingApproval => "WAITING_APPROVAL",
            Self::Approved => "APPROVED",
            Self::Issued => "ISSUED",
            Self::Closed => "CLOSED",
            Self::Voided => "VOIDED",
            Self::WaitingDepositConfirm => "WAITING_DEPOSIT_CONFIRM",
            Self::Deposited => "DEPOSITED",
            Self::NoticePending => "NOTICE_PENDING",
            Self::ReadyForClaim => "READY_FOR_CLAIM",
            Self::Claimed => "CLAIMED",
        }
    }

    /// Check if status is terminal (no further transitions)
    pub fn is_terminal(&self) -> bool {
        matches!(self, Self::Closed | Self::Voided | Self::Issued)
    }
}
