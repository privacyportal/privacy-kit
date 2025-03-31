import config, { ErrorHandler } from './lib/config.js';
import { enableHideMyEmail } from './hideMyEmail.js';
import { enableSubscribeAnonymously } from './subscribeAnonymously.js';
import { isObject } from './lib/objectUtils.js';

type SubscribeAnonymouslyOpts = {
  set_name_field: boolean;
};

type RunOpts = {
  hide_my_email?: boolean;
  subscribe_anonymously?: boolean | SubscribeAnonymouslyOpts;
  on_error: ErrorHandler;
};

type RunParams = {
  client_id: string;
} & RunOpts;

const DEFAULT_PARAMS: RunOpts = {
  hide_my_email: true,
  subscribe_anonymously: true,
  on_error: 'alert',
};

export default class PrivacyAlias {
  static run(params: RunParams) {
    const { client_id, hide_my_email, subscribe_anonymously, on_error } = {
      ...DEFAULT_PARAMS,
      ...params,
    };

    config.client_id = client_id;
    config.onError = on_error;

    if (hide_my_email) {
      enableHideMyEmail();
    }

    if (subscribe_anonymously) {
      if (isObject(subscribe_anonymously)) {
        config.name_scope_required = subscribe_anonymously.set_name_field;
      }
      enableSubscribeAnonymously();
    }
  }
}
