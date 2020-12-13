import cors from 'cors';
import compression from 'compression';
// import fs from 'fs/promises';
import fs from 'fs';
import express, { ErrorRequestHandler, Request, Response, Express, Handler } from 'express';
import { graphqlHTTP } from 'express-graphql';
import morgan from 'morgan';
import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { AccountMutation } from "./account/account.gql.mutation";
import { AccountQuery } from "./account/account.gql.query";
import { GqlContext } from "./common/classes/gql.context";
import { unthunk } from "./common/helpers/unthunk.helper";
import { TransactionMutation } from "./transaction/transaction.gql.mutation";
import { TransactionQuery } from "./transaction/transaction.gql.query";
import HttpErrors from 'http-errors';
import { join } from 'path';
import { EnvSingleton } from './env/env.singleton';
import { pathToArray } from 'graphql/jsutils/Path';
import { DIR_ROOT } from './dir.root';
import { loggerStream } from './common/logger/logger.singleton';
import rateLimit from 'express-rate-limit';

export async function setup(app: Express): Promise<Express> {
  /**
   * GraphQL
   */
  const RootGqlQuery = new GraphQLObjectType<unknown, GqlContext>({
    name: 'RootQueryType',
    fields: {
      ...unthunk(AccountQuery),
      ...unthunk(TransactionQuery),
    },
  });


  const RootGqlMutation = new GraphQLObjectType<unknown, GqlContext>({
    name: 'RootMutationType',
    fields: {
      ...unthunk(AccountMutation),
      ...unthunk(TransactionMutation),
    },
  });

  const schema = new GraphQLSchema({
    query: RootGqlQuery,
    mutation: RootGqlMutation,
  });

  // log access
  app.use((morgan('dev', { stream: loggerStream }) as Handler));
  // from anywhere
  app.use(cors())
  // rate limit
  app.use(rateLimit({
    windowMs: EnvSingleton.RATE_LIMIT_WINDOW_MS,
    max: EnvSingleton.RATE_LIMIT_MAX,
  }));
  // gzip
  app.use(compression());
  // don't require .html at the end of path to access .html files
  app.use(express.static(join(DIR_ROOT, './public'), { extensions: ['html'] }));

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

  return app;
}
