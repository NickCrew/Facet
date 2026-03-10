export const componentKeys = {
  targetLine: (id: string) => `target_line:${id}`,
  profile: (id: string) => `profile:${id}`,
  skillGroup: (id: string) => `skill_group:${id}`,
  project: (id: string) => `project:${id}`,
  bullet: (roleId: string, bulletId: string) => `role:${roleId}:bullet:${bulletId}`,
  education: (id: string) => `education:${id}`,
  certification: (id: string) => `certification:${id}`,
}
