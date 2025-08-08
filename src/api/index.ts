import { HttpApi } from "@effect/platform";
import { DeepResearchApiGroup } from "./deep-research";

export class Api extends HttpApi.make("DeepResearchApi")
	.add(DeepResearchApiGroup)
{ }
