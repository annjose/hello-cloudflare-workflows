// <docs-tag name="full-workflow-example">
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';
import { DurableObject } from "cloudflare:workers";


// User-defined params passed to your workflow
type Params = {
	email: string;
	metadata: Record<string, string>;
};

export class MyDurableObject extends DurableObject<Env> {
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param ctx - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	/**
	 * The Durable Object exposes an RPC method sayHello which will be invoked when a Durable
	 *  Object instance receives a request from a Worker via the same method invocation on the stub
	 *
	 * @param name - The name provided to a Durable Object instance from a Worker
	 * @returns The greeting to be sent back to the Worker
	 */
	async sayHello(name: string): Promise<string> {
		return `Hello, ${name}!`;
	}

	async getPostIdList(): Promise<Array<number>> {
		return [43705649, 43711089];
	}
}

// <docs-tag name="workflow-entrypoint">
export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {

	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		// Can access bindings on `this.env`
		// Can access params on `event.payload`

		const postIdsToProcess = await step.do('Step 1: Read Durable Object MY_DURABLE_OBJECT', async () => {
			// Read from a Durable Object
			const id: DurableObjectId = this.env.MY_DURABLE_OBJECT.idFromName("foo");

			// Create a stub to open a communication channel with the Durable
			// Object instance.
			const stub = this.env.MY_DURABLE_OBJECT.get(id);

			// Call the `sayHello()` RPC method on the stub to invoke the method on
			// the remote Durable Object instance
			const greeting = await stub.sayHello("world in step 0");
			
			const postIds = await stub.getPostIdList();
			return postIds;
		});

		await step.sleep('Sleep: wait for a minute', '1 minute');

		const getData = await step.do('Step 2: Fetch HN post comments from Algolia', async () => {
			// Fetch a list of files from $SOME_SERVICE
			return {
				inputParams: event,
				postIds: postIdsToProcess,
			};
		});

		const summarizePostResults = await step.do('Step 3: Summarize the post', async () => {
			// Summarize the post
			return {
				postId: getData.postIds[0],
				summary: 'This is a summary of the post.',
			};
		});
	}
}
// </docs-tag name="workflow-entrypoint">

// <docs-tag name="workflows-fetch-handler">
export default {
	async fetch(req: Request, env: Env): Promise<Response> {
		let url = new URL(req.url);

		if (url.pathname.startsWith('/favicon')) {
			return Response.json({}, { status: 404 });
		}

		// Get the status of an existing instance, if provided
		// GET /?instanceId=<id here>
		let id = url.searchParams.get('instanceId');
		if (id) {
			let instance = await env.MY_WORKFLOW.get(id);
			return Response.json({
				status: await instance.status(),
			});
		}

		// Read from a Durable Object
		const id_new: DurableObjectId = env.MY_DURABLE_OBJECT.idFromName("foo");

		// Create a stub to open a communication channel with the Durable
		// Object instance.
		const stub = env.MY_DURABLE_OBJECT.get(id_new);

		// Call the `sayHello()` RPC method on the stub to invoke the method on
		// the remote Durable Object instance
		const postIdsToProcess = await stub.getPostIdList();
		
		// Spawn a new instance and return the ID and status
		let instance = await env.MY_WORKFLOW.create();
		// You can also set the ID to match an ID in your own system
		// and pass an optional payload to the Workflow
		// let instance = await env.MY_WORKFLOW.create({
		// 	id: 'id-from-your-system',
		// 	params: { payload: 'to send' },
		// });

		return Response.json({
			id: instance.id,
			details: await instance.status(),
			postIdsToProcess
		});
	},
};
// </docs-tag name="workflows-fetch-handler">
// </docs-tag name="full-workflow-example">
