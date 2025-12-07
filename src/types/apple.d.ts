interface AppleIDAuthConfig {
  clientId: string;
  scope: string;
  redirectURI: string;
  usePopup?: boolean;
}

interface AppleIDAuthResponse {
  authorization: {
    code?: string;
    id_token?: string;
    state?: string;
  };
  user?: {
    email?: string;
    name?: {
      firstName: string;
      lastName: string;
    };
  };
}

interface AppleID {
  auth: {
    init(config: AppleIDAuthConfig): void;
    signIn(): Promise<AppleIDAuthResponse>;
  };
}

interface Window {
  AppleID: AppleID;
}
