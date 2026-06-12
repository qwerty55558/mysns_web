import { graphql } from "@/gql";

export const ConversationsQuery = graphql(`
  query Conversations($limit: Int!, $offset: Int!) {
    conversations(limit: $limit, offset: $offset) {
      id
      updatedAt
      unreadCount
      participant {
        id
        username
        displayName
        avatarUrl
      }
      lastMessage {
        id
        text
        createdAt
        viewerIsSender
        sharedPost {
          id
        }
      }
    }
  }
`);

export const ConversationQuery = graphql(`
  query Conversation($id: ID!) {
    conversation(id: $id) {
      id
      unreadCount
      participant {
        id
        username
        displayName
        avatarUrl
      }
    }
  }
`);

export const ConversationWithQuery = graphql(`
  query ConversationWith($userId: ID!) {
    conversationWith(userId: $userId) {
      id
    }
  }
`);

export const MessagesQuery = graphql(`
  query Messages($conversationId: ID!, $limit: Int!, $offset: Int!) {
    messages(conversationId: $conversationId, limit: $limit, offset: $offset) {
      id
      text
      createdAt
      viewerIsSender
      sender {
        id
        username
        avatarUrl
      }
      sharedPost {
        id
        content
        imageUrls
        item
        amount
        author {
          id
          username
        }
      }
    }
  }
`);

export const UnreadMessageCountQuery = graphql(`
  query UnreadMessageCount {
    unreadMessageCount
  }
`);

export const MyFollowingQuery = graphql(`
  query MyFollowing($limit: Int!, $offset: Int!) {
    me {
      id
      following(limit: $limit, offset: $offset) {
        id
        username
        displayName
        avatarUrl
      }
    }
  }
`);

export const SendMessageMutation = graphql(`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      conversationId
      text
      createdAt
      viewerIsSender
      sender {
        id
        username
        avatarUrl
      }
      sharedPost {
        id
        content
        imageUrls
        item
        amount
        author {
          id
          username
        }
      }
    }
  }
`);

export const MarkConversationReadMutation = graphql(`
  mutation MarkConversationRead($conversationId: ID!) {
    markConversationRead(conversationId: $conversationId) {
      id
      unreadCount
    }
  }
`);
