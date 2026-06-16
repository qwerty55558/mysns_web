import { graphql } from "@/gql";

export const MyWalletQuery = graphql(`
  query MyWallet {
    myWallet {
      id
      balance
      held
    }
  }
`);

export const WalletTransactionsQuery = graphql(`
  query WalletTransactions($limit: Int!, $offset: Int!) {
    walletTransactions(limit: $limit, offset: $offset) {
      id
      type
      amount
      balanceAfter
      memo
      createdAt
      counterparty {
        id
        username
        displayName
        avatarUrl
      }
    }
  }
`);

export const TopUpWalletMutation = graphql(`
  mutation TopUpWallet($amount: Int!) {
    topUpWallet(amount: $amount) {
      id
      balance
    }
  }
`);

export const WithdrawWalletMutation = graphql(`
  mutation WithdrawWallet($amount: Int!) {
    withdrawWallet(amount: $amount) {
      id
      balance
    }
  }
`);

export const TransferMutation = graphql(`
  mutation Transfer($input: TransferInput!) {
    transfer(input: $input) {
      id
      type
      amount
      balanceAfter
      memo
      createdAt
      counterparty {
        id
        username
        displayName
        avatarUrl
      }
    }
  }
`);
