import { Thunk, GraphQLFieldConfigMap, GraphQLNonNull, GraphQLInputObjectType, GraphQLFloat } from "graphql";
import { GqlContext } from "../common/classes/gql.context";
import { CollectionQueryInput } from "../common/gql/gql.collection-query";
import { TransactionCollectionNode, ITransactionCollectionNodeSource } from "./transaction.gql.collection.node";
import Joi from 'joi';
import { ITransactionNodeSource } from "./transaction.gql.node";
import { validateInput } from "../common/helpers/validate-input.helper";
import HttpErrors from "http-errors";

// Return a function (thunk) with the query fields to reduce the change of nasty import races
export const TransactionMutation: Thunk<GraphQLFieldConfigMap<unknown, GqlContext>> = () => ({
  //
});