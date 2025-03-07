import config, { ErrorHandler } from './lib/config.js';
import { enableHideMyEmail } from './hideMyEmail.js';
import { enableSubscribeAnonymously } from './subscribeAnonymously.js';

type RunOpts = {
  enable_hide_my_email: boolean | undefined;
  enable_subscribe_anonymoulsy: boolean | undefined;
  on_error: ErrorHandler;
};

type RunParams = {
  client_id: string;
} & RunOpts;

const DEFAULT_PARAMS: RunOpts = {
  enable_hide_my_email: true,
  enable_subscribe_anonymoulsy: true,
  on_error: 'alert',
};

export default class PrivacyAlias {
  static run(params: RunParams) {
    const {
      client_id,
      enable_hide_my_email,
      enable_subscribe_anonymoulsy,
      on_error,
    } = { ...DEFAULT_PARAMS, ...params };

    config.client_id = client_id;
    config.onError = on_error;

    if (enable_hide_my_email) {
      enableHideMyEmail();
    }

    if (enable_subscribe_anonymoulsy) {
      enableSubscribeAnonymously();
    }
  }
}
