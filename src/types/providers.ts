export enum PROVIDERS {
  Google = 'google',
  Apple = 'apple',
}

export type Providers = (typeof PROVIDERS)[keyof typeof PROVIDERS];
