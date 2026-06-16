import { graphql } from "@/gql";

export const MySplitBillsQuery = graphql(`
  query MySplitBills($limit: Int!, $offset: Int!) {
    mySplitBills(limit: $limit, offset: $offset) {
      id
      totalAmount
      memo
      status
      createdAt
      creator {
        id
        username
        displayName
        avatarUrl
      }
      participants {
        id
        percent
        shareAmount
        isCreator
        status
        respondedAt
        user {
          id
          username
          displayName
          avatarUrl
        }
      }
    }
  }
`);

export const SplitBillQuery = graphql(`
  query SplitBill($id: ID!) {
    splitBill(id: $id) {
      id
      totalAmount
      memo
      status
      createdAt
      creator {
        id
        username
        displayName
        avatarUrl
      }
      participants {
        id
        percent
        shareAmount
        isCreator
        status
        respondedAt
        user {
          id
          username
          displayName
          avatarUrl
        }
      }
    }
  }
`);

/** 내가 응답 대기 중인 요청 — 각 참가자 항목에 소속 정산(bill) 정보를 함께 가져온다. */
export const PendingSplitRequestsQuery = graphql(`
  query PendingSplitRequests($limit: Int!, $offset: Int!) {
    pendingSplitRequests(limit: $limit, offset: $offset) {
      id
      percent
      shareAmount
      status
      bill {
        id
        totalAmount
        memo
        status
        createdAt
        creator {
          id
          username
          displayName
          avatarUrl
        }
      }
    }
  }
`);

export const CreateSplitMutation = graphql(`
  mutation CreateSplit($input: CreateSplitInput!) {
    createSplit(input: $input) {
      id
      status
    }
  }
`);

export const AcceptSplitMutation = graphql(`
  mutation AcceptSplit($splitBillId: ID!) {
    acceptSplit(splitBillId: $splitBillId) {
      id
      status
      respondedAt
    }
  }
`);

export const DeclineSplitMutation = graphql(`
  mutation DeclineSplit($splitBillId: ID!) {
    declineSplit(splitBillId: $splitBillId) {
      id
      status
      respondedAt
    }
  }
`);

export const CancelSplitMutation = graphql(`
  mutation CancelSplit($splitBillId: ID!) {
    cancelSplit(splitBillId: $splitBillId) {
      id
      status
    }
  }
`);

export const SplitUserSearchQuery = graphql(`
  query SplitUserSearch($query: String!) {
    searchUsers(query: $query, limit: 20, offset: 0) {
      id
      username
      displayName
      avatarUrl
      privateAccount
      viewerIsFollowing
    }
  }
`);
