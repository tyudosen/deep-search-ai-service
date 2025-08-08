import { Layer, ManagedRuntime, ConfigProvider } from "effect";
import { AiModels } from "./AiModels.js";
import { Ai } from "./Ai.js";
import { liveConfig } from "../configs/liveConfig.js";
import { WebSearch } from "./WebSearch.js";
import { Auth } from "./Auth.js";

const LiveConfigProvider = Layer.setConfigProvider(
	ConfigProvider.fromMap(liveConfig)
)

export const appLayers = Layer.mergeAll(
	AiModels.Default,
	Ai.Default,
	WebSearch.Default,
	Auth.Default(),
).pipe(
	Layer.provide(LiveConfigProvider)
)


export const runtime = ManagedRuntime.make(appLayers)
