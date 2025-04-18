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
}


// <docs-tag name="workflow-entrypoint">
export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {

	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		// Can access bindings on `this.env`
		// Can access params on `event.payload`

		// const xyz = await step.do('Step 0: Read Durable Object MY_DURABLE_OBJECT', async () => {
		// 	// Read from a Durable Object
		// 	const id: DurableObjectId = this.env.MY_DURABLE_OBJECT.idFromName("foo");

		// 	// Create a stub to open a communication channel with the Durable
		// 	// Object instance.
		// 	const stub = this.env.MY_DURABLE_OBJECT.get(id);

		// 	// Call the `sayHello()` RPC method on the stub to invoke the method on
		// 	// the remote Durable Object instance
		// 	const greeting = await stub.sayHello("world");
		// });

		const files = await step.do('Step 1: Fetch some files', async () => {
			// Fetch a list of files from $SOME_SERVICE
			return {
				inputParams: event,
				files: [
					'doc_7392_rev3.pdf',
					'report_x29_final.pdf',
					'memo_2024_05_12.pdf',
					'file_089_update.pdf',
					'proj_alpha_v2.pdf',
					'data_analysis_q2.pdf',
					'notes_meeting_52.pdf',
					'summary_fy24_draft.pdf',
				],
			};
		});

		// // You can optionally have a Workflow wait for additional data:
		// // human approval or an external webhook or HTTP request, before progressing.
		// // You can submit data via HTTP POST to /accounts/{account_id}/workflows/{workflow_name}/instances/{instance_id}/events/{eventName}
		// const waitForApproval = await step.waitForEvent('request-approval', {
		// 	type: 'approval', // define an optional key to switch on
		// 	timeout: '1 minute', // keep it short for the example!
		// });

		const apiResponse = await step.do('Step 2: Call an API', async () => {
			let resp = await fetch('https://api.cloudflare.com/client/v4/ips');
			return await resp.json<any>();
		});

		// await step.sleep('Sleep: wait on something', '1 minute');

		// await step.do(
		// 	'Step 4: Make a call to write to DB - and it may fail',
		// 	// Define a retry strategy
		// 	{
		// 		retries: {
		// 			limit: 5,
		// 			delay: '5 second',
		// 			backoff: 'exponential',
		// 		},
		// 		timeout: '15 minutes',
		// 	},
		// 	async () => {
		// 		// Do stuff here, with access to the state from our previous steps
		// 		if (Math.random() > 0.5) {
		// 			throw new Error('API call to $STORAGE_SYSTEM failed');
		// 		}
		// 	},
		// );
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
			const greeting = await stub.sayHello("world new");


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
			greeting
		});
	},
};
// </docs-tag name="workflows-fetch-handler">
// </docs-tag name="full-workflow-example">
