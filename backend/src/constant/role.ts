export const SystemRoleName = {
  JYOTSAN: "jyotsan",
  DIPIKA: "dipika",
} as const;

export type SystemRole = (typeof SystemRoleName)[keyof typeof SystemRoleName];
