import cors from 'cors';
import fs from 'fs/promises';
import express, { ErrorRequestHandler, Request, Response } from 'express';
import { graphqlHTTP } from 'express-graphql';
import morgan from 'morgan';
import { graphql, GraphQLObjectType, GraphQLSchema } from "graphql";
import { AccountMutation } from "./account/account.gql.mutation";
import { AccountQuery } from "./account/account.gql.query";
import { GqlContext } from "./common/classes/gql.context";
import { unthunk } from "./common/helpers/unthunk.helper";
import { TransactionMutation } from "./transaction/transaction.gql.mutation";
import { TransactionQuery } from "./transaction/transaction.gql.query";
import HttpErrors from 'http-errors';
import { join } from 'path';
import { ROOT_DIR } from './root-dir';
import { EnvSingleton } from './env/env.singleton';

async function start() {
  const app = express();

  /**
   * GraphQL
   */
  const GqlQuery = new GraphQLObjectType<unknown, GqlContext>({
    name: 'RootQueryType',
    fields: {
      ...unthunk(AccountQuery),
      ...unthunk(TransactionQuery),
    },
  });


  const GqlMutation = new GraphQLObjectType<unknown, GqlContext>({
    name: 'RootMutationType',
    fields: {
      ...unthunk(AccountMutation),
      ...unthunk(TransactionMutation),
    },
  });

  const schema = new GraphQLSchema({
    query: GqlQuery,
    mutation: GqlMutation,
  });

  app.use((morgan('dev') as any));

  app.use(cors())


  // graphql endpoint
  app.post('/', (req, res, next) => (async () => {
    //
  })().catch(next));

  // TODO: static serve public

  app.use(express.static(join(ROOT_DIR, './public')));

  // custom graphiql (interface for graphql) endpoint
  const indexHtml = await fs.readFile(join(ROOT_DIR, './public/index.html')).then(String);
  app.get('/', (req, res) => res.status(200).contentType('text/html').send(indexHtml));

  // graphql endpoint
  app.use('/gql', graphqlHTTP((req, res) => ({
    schema: schema,
    // serve graphiql ourselves to edit html
    graphiql: false,
    context: new GqlContext(),
  })));

  // health check
  app.get('/_health-check', (req, res) => res.status(200).json({
    message: 'Okay :)',
    date: new Date().toISOString(),
  }));

  // error handler
  app.use(function (err, req, res, next) {
    const error = new HttpErrors.InternalServerError();
    res.status(error.statusCode).json(error);
  } as ErrorRequestHandler);

  app.listen(EnvSingleton.PORT, () => console.log(`server listening on ${EnvSingleton.PORT}`));
}

setTimeout(start, 0);