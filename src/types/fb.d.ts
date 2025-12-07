//
// FACEBOOK LOGIN TYPINGS
// ───────────────────────────────────────────
//

interface FacebookAuthResponse {
  accessToken: string;
  expiresIn: number;
  signedRequest: string;
  userID: string;
}

interface FacebookLoginStatusResponse {
  status: "connected" | "not_authorized" | "unknown";
  authResponse?: FacebookAuthResponse;
}

interface FacebookLoginOptions {
  scope?: string; // e.g. "email,public_profile"
  return_scopes?: boolean;
  enable_profile_selector?: boolean;
  profile_selector_ids?: string[];
}

interface FacebookSDK {
  init(config: {
    appId: string;
    cookie?: boolean;
    xfbml?: boolean;
    version: string;
  }): void;

  login(
    callback: (response: FacebookLoginStatusResponse) => void,
    options?: FacebookLoginOptions
  ): void;

  getLoginStatus(
    callback: (response: FacebookLoginStatusResponse) => void
  ): void;

  api(
    path: string,
    callback: (response: any) => void
  ): void;
}

interface Window {
  FB: FacebookSDK;
}
