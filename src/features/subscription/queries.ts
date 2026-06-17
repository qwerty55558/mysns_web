import { graphql } from "@/gql";

export const MySubscriptionQuery = graphql(`
  query MySubscription {
    me {
      id
      isSubscriber
      activeTheme
      activeEmphasis
      activeFont
    }
    mySubscription {
      id
      status
      plan
      theme
      price
      autoRenew
      startedAt
      currentPeriodEnd
      nameEmphasis
      nameFont
    }
    myWallet {
      id
      balance
    }
  }
`);

export const SubscribeMutation = graphql(`
  mutation Subscribe($input: SubscribeInput!) {
    subscribe(input: $input) {
      id
      status
      plan
      theme
      price
      autoRenew
      startedAt
      currentPeriodEnd
    }
  }
`);

export const ChangeSubscriptionThemeMutation = graphql(`
  mutation ChangeSubscriptionTheme($theme: ThemePreset!) {
    changeSubscriptionTheme(theme: $theme) {
      id
      theme
    }
  }
`);

export const CancelSubscriptionMutation = graphql(`
  mutation CancelSubscription {
    cancelSubscription {
      id
      status
      autoRenew
      currentPeriodEnd
    }
  }
`);

export const SubscriptionStatusQuery = graphql(`
  query SubscriptionStatus {
    mySubscription {
      id
      status
      plan
      theme
    }
  }
`);

export const ChangeNameEmphasisMutation = graphql(`
  mutation ChangeNameEmphasis($emphasis: NameEmphasis!) {
    changeNameEmphasis(emphasis: $emphasis) { id nameEmphasis }
  }
`);

export const ChangeNameFontMutation = graphql(`
  mutation ChangeNameFont($font: NameFont!) {
    changeNameFont(font: $font) { id nameFont }
  }
`);
