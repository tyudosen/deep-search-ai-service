import { Effect, pipe } from "effect";
import { HttpApiBuilder } from "@effect/platform";
import { Ai } from "../services/Ai.js";
import { HttpApiDecodeError } from "@effect/platform/HttpApiError";
import type { Research } from "../constants/index.js";
import { SEARCH_CONFIG, PROMPTS } from "../constants/index.js";
import { AiModels } from "../services/AiModels.js";
import { generateReport } from "../services/utils.js";
import { WebSearch } from "../services/WebSearch.js";
import { Api } from "../api/index.js";

const deepResearch: (
	prompt: string,
	depth?: number | undefined,
	breadth?: number | undefined,
	accumulatedResearch?: Research
) => Effect.Effect<
	Research,
	never,
	Ai | AiModels | WebSearch
> = Effect.fn('deep-research')(function* (
	prompt: string,
	depth: number = SEARCH_CONFIG.DEFAULT_DEPTH,
	breadth: number = 3,
	accumulatedResearch: Research = {
		query: undefined,
		queries: [],
		searchResults: [],
		learnings: [],
		completedQueries: [],
	}
) {

	if (!accumulatedResearch.query) {
		accumulatedResearch.query = prompt
	}

	if (depth === 0) {
		yield* Effect.log(`depth is 0`)
		return accumulatedResearch
	}

	const {
		generateSearchQueries,
		searchAndProcess,
		generateLearnings
	} = yield* Ai;

	const { queries } = yield* generateSearchQueries(
		prompt,
		breadth
	)

	accumulatedResearch.queries = queries;

	// Process all queries and collect results first
	for (const query of queries) {
		yield* Effect.log(`Searching the web for: ${query}`)
		const searchResults = yield* searchAndProcess(
			query,
			accumulatedResearch.searchResults
		)
		accumulatedResearch.searchResults.push(
			...searchResults
		)

		// Process all search results for this query
		for (const searchResult of searchResults) {
			yield* Effect.log(`Processing search result: ${searchResult.url}`)
			const learnings = yield* generateLearnings(query, searchResult)

			accumulatedResearch.learnings.push(learnings)
			accumulatedResearch.completedQueries.push(query)
		}
	}

	// Make single recursive call with all accumulated learnings
	if (accumulatedResearch.learnings.length > 0) {
		const allLearnings = accumulatedResearch.learnings[accumulatedResearch.learnings.length - 1]
		if (allLearnings) {
			const newQuery = PROMPTS.DEEP_RESEARCH({ prompt, accumulatedResearch, learnings: allLearnings })

			// More aggressive breadth reduction: each level focuses research more narrowly
			const nextBreadth = Math.max(1, breadth - 1)
			accumulatedResearch = yield* deepResearch(newQuery, depth - 1, nextBreadth, accumulatedResearch)
		}
	}

	yield* Effect.log(`Accumulated research: ${JSON.stringify(accumulatedResearch)}`)

	return accumulatedResearch
})









export const DeepResearchApiGroupLive = HttpApiBuilder.group(Api, "DeepResearchApiGroup", (handlers) =>
	handlers
		.handle(
			"research",
			({ urlParams }) => {
				const prompt = urlParams.query
				let research: any = {};
				const program = pipe(
					prompt,
					deepResearch,
					Effect.tap((res) => { research = res; return; }),
					Effect.flatMap((research) => generateReport(research, {
						calledFrom: 'index.ts'
					}))
				)

				const response = pipe(
					program,
					Effect.flatMap((res) => Effect.succeed({
						research,
						report: res
					})),
					Effect.mapError((e) => new HttpApiDecodeError({
						issues: [],
						message: e.message
					}))

				)

				return response

			}
		)
)

