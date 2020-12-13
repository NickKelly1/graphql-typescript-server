# Writing a GraphQL TypeScript Server in NodeJS

![status](https://health.nickkelly.dev/check?size=xl&url=https://www.examples-accounts.nickkelly.dev/)

GraphQL is becoming an increasingly viable alternative to REST in modern web development by providing significant productivity and performance advantages.

In this post we will explore how to write a vanilla code-first GraphQL Server with TypeScript in NodeJS.

- [Check out the live server](example-accounts.nickkelly.dev)
- [Check out the schema](example-accounts.nickkelly.dev/visualise)
- [Self host with Docker](https://hub.docker.com/repository/docker/nick3141/example-gql-ts-accounts)
- [View the source code on GitHub](https://github.com/NickKelly1/example-gql-ts-accounts)

## After completion

Here's an example of queries that will run on the completed server

### Query: Accounts

```GraphQL
fragment PageInfoFragment on PageInfo{ page pages count total more }

query FindAccounts {
  accounts(query:{limit:2 offset:0 sorts:[ { field:"id", dir: Asc } ]}){
    # collection of (first 2) accounts (sorted by id)
    pageInfo { ...PageInfoFragment }
    can { show create }
    nodes {
      # an account
      can { show withdraw deposit }
      data { id name balance }
      relations {
        # account has many transactions
        transactions(query:{ sorts:[{ field: "amount", dir: Desc }]}){
          # collection of transactions (sorted by amount)
          pageInfo { ...PageInfoFragment }
          can { show }
          nodes {
            can { show }
            data { id description amount }
          }
        }
      }
    }
  }
}
```

### Mutation: Deposit
```GraphQL
mutation Deposit {
  deposit(dto:{ account_id:1 amount:999999 }) {
    data { id name balance }
    relations{
      transactions(query: { sorts: [{ field: "id", dir: Desc }] }) {
        nodes{
          data{ id, description, amount }
        }
      }
    }
  }
}
```

### Mutation: Withdraw
```GraphQL
mutation Withdraw {
  deposit(dto:{ account_id:1 amount:20 }) {
    data { id name balance }
    relations{
      transactions(query: { sorts: [{ field: "id", dir: Desc }] }) {
        nodes{
          data{ id, description, amount }
        }
      }
    }
  }
}
```

## Code-first: decorators vs objects

Most popular guides use experimental / to-be-deprecated [TypeScript (ES6) Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) which obscure the GraphQL resolution process by merging the ORM layer with the API and the API layer with the authorisation layer.

Instead of Decorators, we will use the primitives provided by the [graphql npm package](https://www.npmjs.com/package/graphql). Most importantly: `GraphQLObjectType` and `GraphQLInputType`. These primitiives are powerful enough to build a highly expressive and flexible GraphQL API.


## GraphQL as the Engine of Application State

HATEOAS (Hypertext as the Engine of Application State) is an important part of the rest standard. In practice, HATEOAS means the server should publish client-resource authorisation and routing such that code need not be duplicated on the client.

When requesting a resource the response should contain authorisation and link metadata.

GraphQL makes this a little simpler than REST given it's often served off a single URL. Furthermore, GraphQL's introspective type system lets developers circumvent often poorly maintained, missing or complicated REST API docs.

## Query Resolution

A GraphQL server resolves a query by traversing the `GraphQLObjectType` tree to build a JSON response. However, the `Source` returned from a resolver need not be a `Type` matching the `GraphQLObjectType` will resolve as.

Understanding this opens the door writing flexible and well separated JSON structure.

For example, a `GraphQLObjectType` that resolves an `Account` would typically resolve all fields, relations, and metadata on the same `GraphQLObjectType` node. Although, having separated our ORM layer from our GraphQL layer (something a Decorator based approach would obscure), we can separate an `Account` into multiple `GraphQLObjectTypes` representing an `Accounts` different data types, such as `AccountData` (the fields on an `accounts` table in the database), `AccountActions` (GATEOAS / action authorisation for the `Account` resource), `AccountRelations` (or `AccountConnections` in some GraphQL frameworkrs), and additional objects for any additional metadata types associated with an `Account`.

If we keep all leafs flat on a node, we would have this:

```GraphQL
# AccountNode fields:

  # authorisation
  canShow

  # authorisation
  canWithdraw

  # authorisation
  canDeposit

  # data
  id

  # data
  name

  # data
  balance

  # relation / connection
  transactionRelation(query:{ sorts:[{ field: "amount", dir: Desc }]}){

    # pagination
    pageInfo { ...pageInfoFragment }

    # list
    nodes {

      # authorisation
      canShow

      # data
      id

      # data
      description

      # data
      amount

      # relation / connection
      accountRelation{ ... }
    }
  }
```

If we separate the leaves into their metadata types, we could have this:

```GraphQL
# AccountNode fields:

  # type: AccountActions
  can { show withdraw deposit }

  # type: AccountData
  data { id name balance }

  # type: AccountRelations
  relations {

    # type: TransactionCollection
    transactions(query:{ sorts:[{ field: "amount", dir: Desc }]}){

      # type: PageInfo
      pageInfo { ...PageInfoFragment }

      # type: TransactionCollectionActions
      can { show }

      # type: GraphQLList(TransactionNode)
      nodes {

        # type: TransactionActions
        can { show }

        # type: TransactionData
        data { id description amount }

        # type: TransactionRelations
        relations {
          ...
        }
      }
    }
  }
```

## Code

### Schema

As always with GraphQL, we provide a root Query type for reading and root Mutation type for updating.

Due to NodeJS module resolution and the cyclic nature of graph data structures, we run into all sorts of [import races](https://nodejs.org/api/modules.html#modules_cycles) when our app boot up. To get around this, the GraphQL library lets us define fields as Thunks. That is, instead of defining a field object, we define a function that returns out field object. After all circular modules are resolved by node the GraphQL server can resolve the fields and the schema.

To keep things consistent and avoid circular dependency issues we will write all our `fields` as thunks.

```TypeScript
/**
 * @ root.gql.ts
 *
 * Root Queries & Mutations
 */

import { GraphQLObjectType }  from 'graphql';
import { GqlContext } from './common/gql.context.ts';
import { AccountQuery } from './account/account.gql.query.ts';
import { TransactionQuery } from './transaction/transaction.gql.query.ts';

const RootQuery = new GraphQLObjectType<unknown, GqlContext>({
  name: 'RootQueryType',
  fields: () => ({
    ...unthunk(AccountQuery),
    ...unthunk(TransactionQuery),
  }),
})

const RootMutation = new GraphQLObjectType<unknown, GqlContext>({
  name: 'RootMutationType',
  fields: () => ({
    ...unthunk(AccountMutation),
    ...unthunk(TransactionMutation),
  }),
})

// give this schema to the Gql server
export const schema = new GraphQLSchema({
  query: RootQuery,
  mutation: RootMutation,
});

function unthunk<T>(mbThunk: Thunk<T>): T {
  if (typeof mbThunk === 'function') return (mbThunk as () => T)();
  return mbThunk;
}

```

### AccountQuery

We define a root level query for `Accounts` to give to the `schema`.
This is a set of "fields" that are available on the root query object.

```TypeScript
/**
 * @ account/account.gql.query.ts
 *
 * Accounts Query
 *
 * For queries like FindManyAccounts and FindOneAccount
 */

import HttpErrors from 'http-errors';
import { GqlContext } from '../common/classes/gql.context.ts';
import { Thunk, GraphQLFieldConfigMap, GraphQLNonNull } from "graphql";

// root Query type for an account
// is an "Api Endpoint" for querying Accounts
const AccountQuery = new GraphQLObjectType<unknown, GqlContext>({
  // Get an AccountCollectionNode
  accounts: {
    // tell Gql to resolve the returned object as an AccountCollectionNode
    type: GraphQLNonNull(AccountCollectionNode),

    // Query can have filtering, sorting, pagination (limit, offset), withSoftDeleted, etc...
    args: { query: { type: CollectionQueryInput, }, },

    // return an AccountNodeCollectionSource type, NOT an AccountNode type.
    // Gql will resolve it as an AccountNodeCollection type.
    resolve: async (parent, args, ctx): Promise<IAccountCollectionNodeSource> => {
      if (!ctx.services.accountPolicy.canFindMany()) {
        throw new HttpErrors.Forbidden('Cannot Find Accounts');
      }
      const options = parseQuery(args.query);

      const results  = await ctx
        .services
        .accountRepository
        .findAllAndCount(options);

      // remove models that the requester is unauthorised to view
      // (that should have been filtered out by repository)
      const findableModels: (null | AccountModel)[] = results.rows.map((model) => (
        ctx.services.accountPolicy.canFindOne({ model })
          ? model
          : null
      ));

      const pageInfo = getPageInfo(options, results);

      const collectionSource: IAccountCollectionNodeSource = {
        nodes: findableModels,
        pageInfo,
      };

      return collectionSource;
    },
  },
});
```

### AccountCollectionNode

An `AccountCollectionNode` represents a paginated list of `Accounts`.

It has an array of `AccountNodes`, an `AccountCollectionActions` object with actions the client is/isn't authorised to take on the collection, and a `PageInfo` object detailing the results page number, total pages, whether there are more pages, etc....

```TypeScript
/**
 * @ account/account.gql.collection.node.ts
 *
 * AccountCollectionNode
 *
 * GraphQLObjectType for a paginated collection of Accounts
 */

import { GraphQLObjectType, GraphQLNonNull, GraphQLList, GraphQLBoolean } from "graphql";
import { GqlContext } from "../common/classes/gql.context";
import { GqlNone, IGqlNoneSource } from "../common/gql/gql.none";
import { IPageInfoSource, PageInfo } from "../common/gql/gql.page-info";
import { AccountNode, IAccountNodeSource } from "./account.gql.node";
import { AccountModel } from "./account.model";

export interface IAccountCollectionNodeSource {
  nodes: (null | AccountModel)[];
  pageInfo: IPageInfoSource;
  // ...other collection metadata
}
export const AccountCollectionNode = new GraphQLObjectType<IAccountCollectionNodeSource, GqlContext>({
  name: 'AccountCollectionNode',
  fields: () => ({
    // resolve: list of AccountNode
    nodes: {
      type: GraphQLNonNull(GraphQLList(AccountNode)),
      // source as array of AccountModel's
      resolve: (parent): (null | IAccountNodeSource)[] => parent.nodes,
    },

    // resolve : PageInfo
    pageInfo: {
      type: GraphQLNonNull(PageInfo),
      resolve: (parent): IPageInfoSource => parent.pageInfo,
    },

    // resolve: AccountCollectionActions
    can: {
      resolve: (parent): IGqlNoneSource => GqlNone,
      type: GraphQLNonNull(new GraphQLObjectType<IGqlNoneSource, GqlContext>({
        name: 'AccountCollectionActions',
        fields: {
          show: {
            type: GraphQLNonNull(GraphQLBoolean),
            resolve: (parent, args, ctx): boolean => {
              return ctx.services.accountPolicy.canFindMany();
            },
          },
          create: {
            type: GraphQLNonNull(GraphQLBoolean),
            resolve: (parent, args, ctx): boolean => {
              return ctx.services.accountPolicy.canCreate();
            },
          },
        }
      })),
    },
  }),
});
```

### AccountNode

`AccountNode` is the super object for an `Account`. Attached to it is are objects with the different types of data associated with the parent `Account`, such as `AccountData` with the id, name, etc..., `AccountActions` with client authorisation, and `AccountRelations` which is used to query relations of this account.

Note that the `AccountNode` and all its children; `AccountData`, `AccountActions`, and `AccountRelations`, all have the same source/parent, the ORM's `AccountModel`. Look at the `AccountNode's` fields to see where we tell GraphQL to resolve as `AccountData`, `AccountActions`, `AccountRelations`, but simply return the parent to do so.

Understanding this is especially crucial for paginated relations since even if you prefer flat over nested data and do flatten all `Account` leafs onto the `AccountNode`, paginated `Relations/Connections` will always be nested as
```
        Root Node
            |
  Paginated Connection Node - requires the RootNode's source for querying the related data
       /          \
   PageInfo   Related Nodes
```

```TypeScript
/**
 * @ account/account.gql.node.ts
 * 
 * AccountNode
 * 
 * GrapQLObjectType for an Account
 */

// AccountNode Source is an AccountModel from our ORM
export type IAccountNodeSource = AccountModel;
export const AccountNode = new GraphQLObjectType<IAccountNodeSource, GqlContext>({
  name: 'AccountNode',
  fields: () => ({

    // resolve: AccountData (such as from database `accounts` table)
    data: {
      resolve: (parent): IAccountNodeSource => parent,
      type: GraphQLNonNull(new GraphQLObjectType<IAccountNodeSource, GqlContext>({
        name: 'AccountData',
        fields: {
          id: { type: GraphQLNonNull(GraphQLFloat), resolve: (parent): number => parent.attributes.id, },
          name: { type: GraphQLNonNull(GraphQLString), resolve: (parent): string => parent.attributes.name, },
          balance: { type: GraphQLNonNull(GraphQLFloat), resolve: (parent): number => parent.attributes.balance, },
          owner_id: { type: GraphQLNonNull(GraphQLFloat), resolve: (parent): number => parent.attributes.owner_id, },
          // more fields...
        },
      })),
    },

    // resolve: AccountActions (GATEOAS)
    can: {
      resolve: (parent): IAccountNodeSource => parent,
      type: GraphQLNonNull(new GraphQLObjectType<IAccountNodeSource, GqlContext>({
        name: 'AccountActions',
        fields: () => ({
          show: {
            type: GraphQLNonNull(GraphQLBoolean),
            resolve: (parent, args, ctx): boolean => {
              return ctx.services.accountPolicy.canFindOne({ model: parent });
            },
          },
          withdraw: {
            type: GraphQLNonNull(GraphQLBoolean),
            resolve: (parent, args, ctx): boolean => {
              return ctx.services.accountPolicy.canWithdraw({ model: parent });
            },
          },
          deposit: {
            type: GraphQLNonNull(GraphQLBoolean),
            resolve: (parent, args, ctx): boolean => {
              return ctx.services.accountPolicy.canDeposit({ model: parent });
            },
          },
        }),
      })),
    },

    // resolve: AccountRelations (or AccountConnections)
    relations: {
      resolve: (parent): IAccountNodeSource => parent,
      type: GraphQLNonNull(AccountRelations),
    },
  }),
});

// We've avoided embedding AccountNodeRelations in AccountNode to avoid circular references that TypeScript doesn't like

// Note that this code is mostly generic and could be extracted into a function
// that allows modifying the `where` clause based on different relations (or no relation)
// that have a BelongsTo/BelongsToMany (one|many-x-to-many-Transactions) relation with Transactions
const AccountRelations: GraphQLObjectType<IAccountNodeSource, GqlContext> = new GraphQLObjectType<IAccountNodeSource, GqlContext>({
  name: 'AccountRelations',
  fields: () => ({
    transactions: {
      // tell Gql to resolve the returned object as an TransactionCollectionNode
      type: GraphQLNonNull(TransactionCollectionNode),

      args: { query: { type: CollectionQueryInput, }, },

      // Resolve to the TransactionNodeSource type
      resolve: async (parent, args, ctx): Promise<ITransactionCollectionNodeSource> => {
        // parse the Gql Query Input into repository options
        const options = parseQuery(args.query);

        const results  = await ctx
          .services
          .transactionRepository
          .findAllAndCount({
            ...options,
            filters: {
              ...options.filters,
              // transactions that belong to the account
              account_id: parent.attributes.id,
            },
          });

        // remove models that the requester is unauthorised to view
        // and that weren't caught by the dynamic filter scope in the repository
        const findableModels: (null | TransactionModel)[] = await Promise.all(results
          .rows
          .map(async (model) => {
            return ctx
              .services
              .transactionPolicy.canFindOne({ model, account: parent })
                ? model
                : null
          })
        );

        // paginated collection nodes have pageInfo describing the results...
        const pageInfo = getPageInfo(options, results);

        // resolve (return) to the source required for a TransactionCollectionNode
        const collectionSource: ITransactionCollectionNodeSource = {
          nodes: findableModels,
          pageInfo,
        };

        return collectionSource;
      },
    },
  }),
})
```

### AccountPolicy

Policies are single responsibility objects that authorise actions. This means they can both be used to authorise an action, or to provide a G|HATEOAS response publishing authorised actions. They can be used in HTTP Requests, GraphQL requests, WebSocket requests, RPC requests, CRON contexts, Job contexts, Migration contexts, Seeder contexts, or anything else that could fit a RequestContext interface.

This is in contrast to popular techniques like `Guards` that apply method/route based authorisation to endpoints (such as  resolvers) and whose logic can't be shared with different parts of the codebase. Guards are simple and readable but can't be shared with other parts of the codebase. [An example from TypeGraphQL](https://typegraphql.com/docs/authorization.html#docsNav). Guards are more useful when working at high resolution such as individual fields like `email` or `password`, where the items are too granular to publish authorisation for everything.

```TypeScript
// Guard example from TypeGraphQL, using the @Authorized decorator

@Resolver()
class MyResolver {
  // Since the logic is statically attached to the endpoint and inaccessable elsewhere in the
  // application, we can't publish this authorisation to the client without duplicating the logic
  // (i.e. const canDoThing = user.permissions.includes("ADMIN")...)
  @Authorized("ADMIN")
  @Query()
  authedQuery(): string {
    return "Admin users only!";
  }

}
```

Alternatively, below is our reusable `AccountPolicy`.

```TypeScript
/**
 * @ account/account.policy.ts
 * 
 * AccountPolicy
 * 
 * Handles authorisation for Accounts
 */
export class AccountPolicy {
  constructor(
    protected readonly ctx: BaseContext,
  ) {
    //
  }

  /**
   * Can the Requester Find Accounts?
   */
  canFindMany(): boolean {
    return this.ctx.hasPermission(Permission.Account.ViewOwn);
  }

  /**
   * Can the Requester Create an Account?
   */
  canCreate(): boolean {
    return this.ctx.hasPermission(Permission.Account.Create);
  }

  /**
   * Can the Requester Find the Account?
   *
   * @param arg
   */
  canFindOne(arg: { model: AccountModel }): boolean {
    const { model } = arg;

    // must be Owned by the Requester
    if (!model.isOwnedBy(this.ctx)) return false;

    return this.ctx.hasPermission(Permission.Account.ViewOwn);
  }

  /**
   * Can the Requester Withdraw from the Account?
   *
   * @param arg
   */
  canWithdraw(arg: { model: AccountModel }): boolean {
    const { model } = arg;

    // must be Findable
    if (!this.canFindOne({ model })) return false;

    // must be Owned by the Requester
    if (!model.isOwnedBy(this.ctx)) return false;

    return this.ctx.hasPermission(Permission.Account.WithdrawOwn);
  }

  /**
   * Can the Requester Deposit to the Account?
   *
   * @param arg
   */
  canDeposit(arg: { model: AccountModel }): boolean {
    const { model } = arg;

    // must be Findable
    if (!this.canFindOne({ model })) return false;

    // must be Owned by the Requester
    if (!model.isOwnedBy(this.ctx)) return false;

    return this.ctx.hasPermission(Permission.Account.DepositOwn);
  }
}
```

### And more ObjectTypes...

For the remaining GraphQL code see the [GitHub](https://github.com/NickKelly1/example-gql-ts-accounts) repository for this post.

## What we didn't cover

### Using DataLoader

N+1 Query

### Using a Database

Migrations, ORM, ...

Mostly container

### How contexts are created

Framework...
