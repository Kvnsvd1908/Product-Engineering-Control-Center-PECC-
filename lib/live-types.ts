export type Settings = { repoUrl: string; gitToken: string; provider: 'none' | 'jira' | 'taiga' | 'notion'; boardUrl: string; boardToken: string; email: string; projectKey: string }
export type Evidence = { id: string; title: string; url: string; actor: string; assignee?: string; date: string; status: string; kind: string }
export type Snapshot = { repo: string; url: string; branch: string; head: string; syncedAt: string; records: Evidence[]; files: string[]; warnings: string[]; board: string }
export type Proposal = { id: string; title: string; reason: string; path: string; before: string; after: string; head: string; status: 'pending' | 'applying' | 'applied' | 'rejected' | 'failed'; url?: string }
