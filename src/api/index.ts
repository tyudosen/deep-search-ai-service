import { HttpApi } from "@effect/platform";
import { DeepResearchApiGroup } from "./deep-research.js";

export class Api extends HttpApi.make("DeepResearchApi")
	.add(DeepResearchApiGroup)
{ }
