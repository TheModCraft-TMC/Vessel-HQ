export type RoleViewModel = {
  ID: number;
  Name: string;
  Description: string;
  Authorizations: string[];
};

export const RoleTypes = {
  ENDPOINT_ADMIN: 1,
  HELPDESK: 2,
  STANDARD: 3,
  READ_ONLY: 4,
  OPERATOR: 5,
} as const;
