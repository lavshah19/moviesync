export const SystemRoleName = {
  JYOTSAN: "jyotsan",
  DIPIKA: "dipika",
} as const;

export type SystemRole = (typeof SystemRoleName)[keyof typeof SystemRoleName];

export const SYSTEM_ROLES = Object.values(SystemRoleName);

// Exactly two people: each recommends into the other's column.
export const otherRole = (role: SystemRole): SystemRole =>
  role === SystemRoleName.JYOTSAN ? SystemRoleName.DIPIKA : SystemRoleName.JYOTSAN;
