import { db } from '@flowdesk/db';

export const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    avatarUrl: String
  }

  type Project {
    id: ID!
    name: String!
    slug: String!
    description: String
    status: String!
    workspaceId: ID!
  }

  type Task {
    id: ID!
    title: String!
    status: String!
    priority: String!
    projectId: ID!
    assignee: User
  }

  type Query {
    projects(workspaceId: ID!): [Project]
    tasks(projectId: ID!): [Task]
    user(id: ID!): User
  }
`;

export const resolvers = {
    Query: {
        projects: async (_: any, { workspaceId }: { workspaceId: string }) => {
            return await db.query.projects.findMany({
                where: (projects, { eq }) => eq(projects.workspaceId, workspaceId),
            });
        },
        tasks: async (_: any, { projectId }: { projectId: string }) => {
            return await db.query.tasks.findMany({
                where: (tasks, { eq }) => eq(tasks.projectId, projectId),
                with: { assignee: true }
            });
        },
        user: async (_: any, { id }: { id: string }) => {
            return await db.query.users.findFirst({
                where: (users, { eq }) => eq(users.id, id),
            });
        },
    },
};
