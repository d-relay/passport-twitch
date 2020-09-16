import fetch from "node-fetch";
import OAuth2Strategy from "passport-oauth2";

interface Options extends OAuth2Strategy.StrategyOptions {
    passReqToCallback: boolean;
}

export class Strategy extends OAuth2Strategy {
    private clientID: string;
    /**
     * `Strategy` constructor.
     *
     * The Twitch authentication strategy authenticates requests by delegating to
     * Twitch using the OAuth 2.0 protocol.
     *
     * Applications must supply a `verify` callback which accepts an `accessToken`,
     * `refreshToken` and service-specific `profile`, and then calls the `done`
     * callback supplying a `user`, which should be set to `false` if the
     * credentials are not valid.  If an exception occured, `err` should be set.
     *
     * Options:
     *   - `clientID`      your Twitch application"s client id
     *   - `clientSecret`  your Twitch application"s client secret
     *   - `callbackURL`   URL to which Twitch will redirect the user after granting authorization
     *
     * Examples:
     *
     *     passport.use(new TwitchStrategy({
     *         clientID: "123-456-789",
     *         clientSecret: "shhh-its-a-secret"
     *         callbackURL: "https://www.example.net/auth/twitch/callback"
     *       },
     *       function(accessToken, refreshToken, profile, done) {
     *         User.findOrCreate(..., function (err, user) {
     *           done(err, user);
     *         });
     *       }
     *     ));
     *
     * @param {Object} options
     * @param {OAuth2Strategy.VerifyFunctionWithRequest} verify
     * @api public
     */
    constructor(options: Options, verify: OAuth2Strategy.VerifyFunctionWithRequest) {
        const params = {
            ...options,
            name: 'twitch',
            authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
            tokenURL: 'https://id.twitch.tv/oauth2/token'
        }
        super(params, verify);
        this.clientID = options.clientID;
        this._oauth2.setAuthMethod('Bearer');
        this._oauth2.useAuthorizationHeaderforGET(true);
    }

    /**
     * Retrieve user profile from Twitch.
     * This function constructs a normalized profile, with the following properties:
     *   - `provider`         always set to `twitch`
     *   - `id`
     *   - `username`
     *   - `displayName`
     * @param {String} accessToken
     * @param {Function} done
     * @api protected
     */
    userProfile(accessToken: string, done: (err?: Error | null, profile?: any) => void): Promise<void> {
        return fetch('https://api.twitch.tv/helix/users', {
            method: 'GET',
            headers: {
                'Client-ID': this.clientID,
                'Accept': 'application/vnd.twitchtv.v5+json',
                'Authorization': 'Bearer ' + accessToken
            }
        }).then(response => {
            if (!response.ok) throw new OAuth2Strategy.InternalOAuthError("failed to fetch user profile", response);
            else return response.json();
        }).then(json => {
            const body = json.data[0];
            return done(null, body);
        }).catch(error => {
            return done(error, null);
        });
    }

    /**
     * Return extra parameters to be included in the authorization request.
     * @param {Object} options
     * @return {Object}
     * @api protected
     */
    authorizationParams(options: { forceVerify?: boolean }): object {
        return {
            force_verify: (typeof options.forceVerify === 'boolean') ? false : options.forceVerify
        };
    }
}

export default Strategy;