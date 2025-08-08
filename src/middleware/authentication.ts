import { HttpApiMiddleware, HttpApiSchema, HttpApiSecurity } from "@effect/platform";
import { Config, Effect, Layer, Redacted, Schema } from "effect";
import { Auth } from "../services/Auth.js";
import type { AuthenticateWithSessionCookieFailedResponse } from "@workos-inc/node";

class Unauthorized extends Schema.TaggedError<Unauthorized>()(
	"Unauthorized",
	{},
	HttpApiSchema.annotations({ status: 401 })
) { }



export class Authentication extends HttpApiMiddleware.Tag<Authentication>()(
	"Api/Authentication",
	{
		failure: Unauthorized,
		optional: false,
		security: {
			cookie: HttpApiSecurity.apiKey({
				in: 'header',
				key: 'Cookie'
			})
		}
	}
) { }


export const AuthenticationLive = Layer.effect(
	Authentication,
	Effect.gen(function* () {
		const cookiePassword = yield* Config.string('WORKOS_COOKIE_PASSWORD')
		const { workos } = yield* Auth;


		return Authentication.of({
			cookie: (cookie) => Effect.gen(function* () {


				const session = workos.userManagement.loadSealedSession({
					sessionData: Redacted.value(cookie),
					cookiePassword
				})


				const { authenticated } = yield* Effect.tryPromise({
					try: () => session.authenticate() as Promise<AuthenticateWithSessionCookieFailedResponse>,
					catch: () => new Unauthorized()
				})

				if (authenticated) {
					return
				}

				return yield* Effect.fail(new Unauthorized())
			})
		})
	})
).pipe(
	Layer.provide(Auth.Default())
)
