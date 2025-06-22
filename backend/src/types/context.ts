import { PrismaClient } from '@prisma/client';

export interface GraphQLContext {
  prisma: PrismaClient;
}

export interface GraphQLResolverArgs {
  parent: any;
  args: any;
  context: GraphQLContext;
  info: any;
}