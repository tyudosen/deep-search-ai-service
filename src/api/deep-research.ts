import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";
import { Authentication } from "../middleware/authentication.js";

export class DeepResearchApiGroup extends HttpApiGroup.make("DeepResearchApiGroup")
	.add(
		HttpApiEndpoint
			.get("research", '/research')
			.setUrlParams(
				Schema.Struct({
					query: Schema.String.pipe(Schema.minLength(8))
				})
			)
			.addSuccess(Schema.Any)
	)
	.middleware(Authentication)
{ }


