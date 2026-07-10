export type MandateStatus = "ACTIVE" | "AT_RISK" | "ON_HOLD" | "CLOSED";
export type MeetingType = "MID_YEAR" | "YEAR_END" | "TOPIC" | "REVIEW";
export type MeetingStatus = "INVITING" | "IN_PROGRESS" | "ARCHIVED";
export type HoldingStatus = "CLAIMED" | "DELIVERED" | "HANDED_OVER" | "MISSED";

export const MANDATE_STATUS_LABEL: Record<MandateStatus, string> = {
  ACTIVE: "进行中", AT_RISK: "有风险", ON_HOLD: "暂缓", CLOSED: "已结案",
};
export const MEETING_TYPE_LABEL: Record<MeetingType, string> = {
  MID_YEAR: "年中战略会", YEAR_END: "年底战略会", TOPIC: "专题会", REVIEW: "复盘会",
};
export const MEETING_STATUS_LABEL: Record<MeetingStatus, string> = {
  INVITING: "邀请中", IN_PROGRESS: "进行中", ARCHIVED: "已存档",
};
export const HOLDING_STATUS_LABEL: Record<HoldingStatus, string> = {
  CLAIMED: "已认领", DELIVERED: "已交账", HANDED_OVER: "已移交", MISSED: "未交账",
};

export interface Holding {
  id: string;
  mandateId: string;
  meetingId: string;
  meetingTitle: string;
  meetingType: MeetingType;
  meetingPeriod: string;
  meetingDate: string | null;
  holderName: string;
  holderRole: string;
  invitedAt: string | null;
  attendedAt: string | null;
  status: HoldingStatus;
  commitment: string | null;
  deadline: string | null;
  deliveryNote: string | null;
  handoverNote: string | null;
  handoverToName: string | null;
}

export interface Mandate {
  id: string;
  code: string;
  title: string;
  theme: string | null;
  description: string | null;
  status: MandateStatus;
  closed: boolean;
  linkedProjectCode: string | null;
  linkedAssumptionCode: string | null;
  holdings: Holding[];
}

export interface Meeting {
  id: string;
  planId: string | null;
  planLabel: string | null;
  title: string;
  meetingType: MeetingType;
  period: string;
  meetingDate: string | null;
  status: MeetingStatus;
  agenda: string | null;
  notes: string | null;
  holdingCount: number;
  participantUserIds: string[];
  participants: MeetingParticipant[];
  todos: MeetingTodo[];
}

export interface MeetingParticipant {
  id: string;
  userId: string | null;
  name: string;
  role: string;
}

export interface MeetingTodo {
  id?: string;
  title: string;
  ownerUserId: string | null;
  ownerName: string | null;
  dueDate: string | null;
  completed: boolean;
}

export interface MeetingPlanOption {
  id: string;
  label: string;
  status: string;
}

export interface MeetingUserOption {
  id: string;
  name: string;
  role: string;
  orgUnitName: string | null;
}

export interface MandateBundle {
  mandates: Mandate[];
  meetings: Meeting[];
  plans: MeetingPlanOption[];
  users: MeetingUserOption[];
}
