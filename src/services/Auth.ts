import { WorkOS } from "@workos-inc/node";
import { Config, Data, Effect } from "effect";

export class AuthenticateWithCodeError extends Data.TaggedError('AuthenticateWithCodeError')<
	{
		error: unknown
	}
> { }


export class Auth extends Effect.Service<Auth>()("Auth", {
	effect: Effect.fn("AuthService")(function* () {
		const clientId = yield* Config.string('WORKOS_CLIENT_ID')
		const workos = new WorkOS(process.env.WORKOS_API_KEY, {
			clientId
		});


		const authenticateWithCode = Effect.fn("authenticateWithCode")(function* (code: string) {
			const { user } = yield* Effect.tryPromise({
				try: () => workos.userManagement.authenticateWithCode({
					code,
					clientId
				}),
				catch: (error) => new AuthenticateWithCodeError({ error })
			})


			return {
				user
			} as const
		})


		return {
			authenticateWithCode,
			workos
		} as const
	})
}) { }

