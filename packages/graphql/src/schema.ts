import { gql } from 'graphql-tag';

export const typeDefs = gql`
    # Scalars
    scalar DateTime
    scalar JSON

    # Enums
    enum OrgRole {
        OWNER
        ADMIN
        MEMBER
        VIEWER
    }

    enum ProjectStatus {
        ACTIVE
        ARCHIVED
        DELETED
    }

    enum TaskStatus {
        TODO
        IN_PROGRESS
        IN_REVIEW
        DONE
    }

    enum TaskPriority {
        URGENT
        HIGH
        MEDIUM
        LOW
        NONE
    }

    enum Plan {
        FREE
        PRO
        TEAM
    }

    enum SubStatus {
        ACTIVE
        PAST_DUE
        CANCELED
        TRIALING
    }

    enum NotificationType {
        TASK_ASSIGNED
        TASK_UPDATED
        COMMENT_ADDED
        INVITE_RECEIVED
        MENTION
        DUE_SOON
    }

    # User Types
    type User {
        id: ID!
        name: String!
        email: String!
        emailVerified: DateTime
        avatarUrl: String
        image: String
        createdAt: DateTime!
        updatedAt: DateTime!
        organizations: [Organization!]!
        memberships: [OrgMember!]!
    }

    type OrgMember {
        id: ID!
        orgId: ID!
        userId: ID!
        role: OrgRole!
        joinedAt: DateTime!
        user: User!
        organization: Organization!
    }

    type Invitation {
        id: ID!
        orgId: ID!
        email: String!
        role: OrgRole!
        invitedBy: User!
        expiresAt: DateTime!
        acceptedAt: DateTime
    }

    # Organization Types
    type Organization {
        id: ID!
        name: String!
        slug: String!
        plan: Plan!
        createdAt: DateTime!
        members: [OrgMember!]!
        workspaces: [Workspace!]!
        invitations: [Invitation!]!
        subscription: Subscription
    }

    type Subscription {
        id: ID!
        orgId: ID!
        stripeSubId: String
        plan: Plan!
        status: SubStatus!
        currentPeriodEnd: DateTime
    }

    # Workspace Types
    type Workspace {
        id: ID!
        orgId: ID!
        name: String!
        slug: String!
        color: String
        createdBy: User!
        createdAt: DateTime!
        projects: [Project!]!
        documents: [Document!]!
    }

    # Project Types
    type Project {
        id: ID!
        workspaceId: ID!
        orgId: ID!
        name: String!
        slug: String!
        description: String
        icon: String
        status: ProjectStatus!
        createdBy: User!
        createdAt: DateTime!
        tasks: [Task!]!
        members: [ProjectMember!]!
    }

    type ProjectMember {
        id: ID!
        projectId: ID!
        userId: ID!
        role: OrgRole!
        user: User!
        project: Project!
    }

    # Task Types
    type Task {
        id: ID!
        projectId: ID!
        orgId: ID!
        title: String!
        description: JSON
        status: TaskStatus!
        priority: TaskPriority!
        position: Int!
        assigneeId: ID
        assignee: User
        createdBy: User!
        dueDate: DateTime
        completedAt: DateTime
        createdAt: DateTime!
        updatedAt: DateTime!
        project: Project!
        labels: [TaskLabel!]!
        comments: [Comment!]!
        attachments: [Attachment!]!
    }

    type TaskLabel {
        id: ID!
        orgId: ID!
        name: String!
        color: String!
    }

    type TaskLabelMap {
        taskId: ID!
        labelId: ID!
        task: Task!
        label: TaskLabel!
    }

    type Comment {
        id: ID!
        taskId: ID!
        userId: ID!
        content: JSON!
        resolvedAt: DateTime
        resolvedBy: User
        user: User!
        task: Task!
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    type Attachment {
        id: ID!
        taskId: ID!
        userId: ID!
        url: String!
        publicId: String
        filename: String!
        size: Int!
        mimeType: String
        user: User!
        task: Task!
        createdAt: DateTime!
    }

    # Activity Log
    type ActivityLog {
        id: ID!
        orgId: ID!
        taskId: ID
        projectId: ID
        documentId: ID
        userId: ID!
        action: String!
        metadata: JSON
        user: User!
        task: Task
        project: Project
        document: Document
        createdAt: DateTime!
    }

    # Document Types
    type Document {
        id: ID!
        workspaceId: ID!
        orgId: ID!
        parentId: ID
        title: String!
        content: JSON
        icon: String
        createdBy: User!
        parent: Document
        children: [Document!]!
        versions: [DocumentVersion!]!
        comments: [DocumentComment!]!
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    type DocumentVersion {
        id: ID!
        documentId: ID!
        orgId: ID!
        title: String!
        content: JSON
        changeNote: String
        createdBy: User!
        createdAt: DateTime!
    }

    type DocumentComment {
        id: ID!
        documentId: ID!
        orgId: ID!
        userId: ID!
        parentId: ID
        content: String!
        resolvedAt: DateTime
        user: User!
        document: Document!
        parent: DocumentComment
        replies: [DocumentComment!]!
        createdAt: DateTime!
        updatedAt: DateTime!
    }

    # Notification Types
    type Notification {
        id: ID!
        userId: ID!
        orgId: ID!
        type: NotificationType!
        payload: JSON!
        readAt: DateTime
        createdAt: DateTime!
        user: User!
        organization: Organization!
    }

    # Analytics Types
    type TaskCompletionStats {
        total: Int!
        completed: Int!
        completionRate: Float!
    }

    type VelocityData {
        week: String!
        completed: Int!
    }

    type DashboardStats {
        totalTasks: Int!
        completedTasks: Int!
        inProgressTasks: Int!
        overdueTasks: Int!
        totalProjects: Int!
        activeProjects: Int!
    }

    # Input Types
    input CreateOrganizationInput {
        name: String!
        slug: String!
    }

    input UpdateOrganizationInput {
        orgId: ID!
        name: String
        slug: String
        logoUrl: String
    }

    input CreateWorkspaceInput {
        orgId: ID!
        name: String!
        slug: String!
        color: String
    }

    input UpdateWorkspaceInput {
        id: ID!
        name: String
        color: String
    }

    input CreateProjectInput {
        orgId: ID!
        workspaceId: ID!
        name: String!
        slug: String!
        description: String
        icon: String
    }

    input UpdateProjectInput {
        id: ID!
        name: String
        description: String
        status: ProjectStatus
        icon: String
    }

    input CreateTaskInput {
        orgId: ID!
        projectId: ID!
        title: String!
        description: JSON
        status: TaskStatus
        priority: TaskPriority
        assigneeId: ID
        dueDate: DateTime
    }

    input UpdateTaskInput {
        id: ID!
        title: String
        description: JSON
        status: TaskStatus
        priority: TaskPriority
        assigneeId: ID
        dueDate: DateTime
    }

    input MoveTaskInput {
        id: ID!
        status: TaskStatus!
        position: Int!
    }

    input BulkUpdateTasksInput {
        ids: [ID!]!
        status: TaskStatus
        assigneeId: ID
        priority: TaskPriority
    }

    input CreateCommentInput {
        orgId: ID!
        taskId: ID!
        content: JSON!
    }

    input UpdateCommentInput {
        id: ID!
        content: JSON
    }

    input InviteMemberInput {
        orgId: ID!
        email: String!
        role: OrgRole!
    }

    input CreateDocumentInput {
        orgId: ID!
        workspaceId: ID!
        title: String!
        content: JSON
        parentId: ID
        icon: String
    }

    input UpdateDocumentInput {
        orgId: ID!
        id: ID!
        title: String
        content: JSON
        icon: String
        changeNote: String
    }

    input CreateDocumentCommentInput {
        orgId: ID!
        documentId: ID!
        content: String!
        parentId: ID
    }

    # Queries
    type Query {
        # User queries
        me: User
        user(id: ID!): User

        # Organization queries
        organization(id: ID!): Organization
        organizationBySlug(slug: String!): Organization
        organizations: [Organization!]!

        # Workspace queries
        workspace(id: ID!): Workspace
        workspacesByOrg(orgId: ID!): [Workspace!]!

        # Project queries
        project(id: ID!): Project
        projectsByWorkspace(workspaceId: ID!): [Project!]!
        projectsByOrg(orgId: ID!): [Project!]!

        # Task queries
        task(id: ID!): Task
        tasksByProject(projectId: ID!): [Task!]!
        tasksByOrg(orgId: ID!): [Task!]!
        myTasks(orgId: ID!): [Task!]!

        # Label queries
        labelsByOrg(orgId: ID!): [TaskLabel!]!

        # Comment queries
        commentsByTask(taskId: ID!): [Comment!]!

        # Document queries
        document(id: ID!): Document
        documentsByWorkspace(workspaceId: ID!): [Document!]!
        documentsByOrg(orgId: ID!): [Document!]!
        documentVersions(documentId: ID!): [DocumentVersion!]!
        documentComments(documentId: ID!): [DocumentComment!]!

        # Activity queries
        activityByOrg(orgId: ID!, limit: Int): [ActivityLog!]!
        activityByTask(taskId: ID!): [ActivityLog!]!
        activityByProject(projectId: ID!): [ActivityLog!]!

        # Notification queries
        notifications: [Notification!]!
        unreadNotificationCount: Int!

        # Analytics queries
        dashboardStats(orgId: ID!, days: Int): DashboardStats!
        taskCompletion(orgId: ID!, days: Int): TaskCompletionStats!
        velocity(orgId: ID!, days: Int): [VelocityData!]!

        # Billing queries
        subscription(orgId: ID!): Subscription
    }

    # Mutations
    type Mutation {
        # Organization mutations
        createOrganization(input: CreateOrganizationInput!): Organization!
        updateOrganization(input: UpdateOrganizationInput!): Organization!
        deleteOrganization(orgId: ID!): Boolean!

        # Member mutations
        inviteMember(input: InviteMemberInput!): Invitation!
        updateMemberRole(orgId: ID!, userId: ID!, role: OrgRole!): OrgMember!
        removeMember(orgId: ID!, userId: ID!): Boolean!
        acceptInvite(token: String!): OrgMember!

        # Workspace mutations
        createWorkspace(input: CreateWorkspaceInput!): Workspace!
        updateWorkspace(input: UpdateWorkspaceInput!): Workspace!
        deleteWorkspace(id: ID!): Boolean!

        # Project mutations
        createProject(input: CreateProjectInput!): Project!
        updateProject(input: UpdateProjectInput!): Project!
        deleteProject(id: ID!): Boolean!
        archiveProject(id: ID!): Project!

        # Task mutations
        createTask(input: CreateTaskInput!): Task!
        updateTask(input: UpdateTaskInput!): Task!
        deleteTask(id: ID!): Boolean!
        moveTask(input: MoveTaskInput!): Task!
        bulkUpdateTasks(input: BulkUpdateTasksInput!): [Task!]!

        # Comment mutations
        createComment(input: CreateCommentInput!): Comment!
        updateComment(input: UpdateCommentInput!): Comment!
        deleteComment(id: ID!): Boolean!

        # Document mutations
        createDocument(input: CreateDocumentInput!): Document!
        updateDocument(input: UpdateDocumentInput!): Document!
        deleteDocument(id: ID!): Boolean!
        createDocumentVersion(documentId: ID!, title: String!, content: JSON, changeNote: String): DocumentVersion!
        restoreDocumentVersion(versionId: ID!): Document!

        # Document comment mutations
        createDocumentComment(input: CreateDocumentCommentInput!): DocumentComment!
        updateDocumentComment(id: ID!, content: String, resolved: Boolean): DocumentComment!
        deleteDocumentComment(id: ID!): Boolean!

        # Notification mutations
        markNotificationRead(id: ID!): Notification!
        markAllNotificationsRead: Boolean!

        # Attachment mutations
        deleteAttachment(id: ID!): Boolean!
    }
`;
