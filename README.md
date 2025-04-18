# Commands

## Run locally and deploy
```sh
npm run generate-types
npm run dev
npm run deploy
```

## Test the workflow

Note: `workflows-starter` is the name of the workflow.
```sh
# start the workflow
npx wrangler workflows trigger workflows-starter '{"hello":"world"}'

# check status of workflow
npx wrangler@latest workflows instances describe workflows-starter latest
```
Another option is to navigate to this URL https://hello-cloudflare-workflows.annjose.workers.dev

# References
* [Workflows documentation](https://developers.cloudflare.com/workflows/) contains examples, the API reference, and architecture guidance.
* [Durable Objects Docs](https://developers.cloudflare.com/durable-objects/)
* [Alarm API](https://developers.cloudflare.com/durable-objects/api/alarms/)
* [Rules of Workflows](https://developers.cloudflare.com/workflows/build/rules-of-workflows/)