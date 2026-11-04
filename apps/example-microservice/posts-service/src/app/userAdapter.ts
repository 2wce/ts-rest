import { initClient } from '@ts-restless/core';
import {
  User,
  usersApi,
} from '@ts-restless/example-microservice-util-users-api';

const usersClient = initClient(usersApi, {
  baseHeaders: {},
  baseUrl: 'http://localhost:5002',
});

export const userAdapter = {
  getUser: async (id: string): Promise<User | undefined> => {
    const userResponse = await usersClient.getUser({ params: { id } });

    if (userResponse.status !== 200) {
      return undefined;
    }

    return userResponse.body;
  },
};
