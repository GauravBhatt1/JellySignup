export interface JellyfinApiUser {
  Id: string;
  Name: string;
  HasPassword: boolean;
  HasConfiguredPassword: boolean;
  Policy?: {
    IsAdministrator: boolean;
    IsDisabled: boolean;
    EnableContentDownloading?: boolean;
    [key: string]: any;
  };
  LastLoginDate?: string;
  LastActivityDate?: string;
  [key: string]: any;
}