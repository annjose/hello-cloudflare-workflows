# Cloudflare Workflows

This is the starter template for Workflows, a durable execution engine built on top of Cloudflare Workers.

* Clone this repository to get started with Workflows
* Read the [Workflows announcement blog](https://blog.cloudflare.com/building-workflows-durable-execution-on-workers/) to learn more about what Workflows is and how to build durable, multi-step applications using the Workflows model.
* Review the [Workflows developer documentation](https://developers.cloudflare.com/workflows/) to dive deeper into the Workflows API and how it works.

## Usage

**Visit the [get started guide](https://developers.cloudflare.com/workflows/get-started/guide/) for Workflows to create and deploy your first Workflow.**

### Deploy it

Deploy it to your own Cloudflare account directly:

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/workflows-starter)

You can also create a project using this template by using `npm create cloudflare@latest`:

```sh
npm create cloudflare@latest workflows-starter -- --template "cloudflare/workflows-starter"
```

This will automatically clone this repository, install the dependencies, and prompt you to optionally deploy:

```sh
╭ Create an application with Cloudflare Step 1 of 3
│
├ In which directory do you want to create your application?
│ dir ./workflows-tutorial
│
├ What would you like to start with?
│ category Template from a GitHub repo
│
├ What's the url of git repo containing the template you'd like to use?
│ repository cloudflare/workflows-starter
│
├ Cloning template from: cloudflare/workflows-starter
│
├ template cloned and validated
│
├ Copying template files
│ files copied to project directory
│
├ Installing dependencies
│ installed via `npm install`
│
╰ Application created

╭ Configuring your application for Cloudflare Step 2 of 3
│
├ Installing @cloudflare/workers-types
│ installed via npm
│
├ Adding latest types to `tsconfig.json`
│ added @cloudflare/workers-types/2023-07-01
│
├ Do you want to use git for version control?
│ yes git
│
├ Initializing git repo
│ initialized git
│
├ Committing new files
│ git commit
│
╰ Application configured

╭ Deploy with Cloudflare Step 3 of 3
│
├ Do you want to deploy your application?
│ no deploy via `npm run deploy`
│
╰ Done

────────────────────────────────────────────────────────────
🎉  SUCCESS  Application created successfully!
```

The [Workflows documentation](https://developers.cloudflare.com/workflows/) contains examples, the API reference, and architecture guidance.

## License

Copyright 2024, Cloudflare. Apache 2.0 licensed. See the LICENSE file for details.


### Steps
- cron job starts a worker by calling worker.scheduled() 
    - start first workflow get_postid
        - get the post ids to summarize
        - call HN homepage to get the 30 posts - get post ids
        - save to Durable object savePostIds([postid....])
            - save to this.ctx.storage.exec()  `insert into post_ids set summarized=false`
    - start second workflow summarize_posts()
    - die
- Workflow summarize_posts()
    - step 1: ask DurableObject to summarize. DO:summarizePosts()
        - DO:summarizePosts()
        -   look up its storage and execute sql `select * from post_ids set summarized=false limit 1`
    - step 2: get post data from Algolia API. Save the data to DO {step2-output: {postId: 12345, data: <json>}}
      - NOTE: We may not have to store the intermediate type in DO, CF seems to do it automatically
    - step 3: get post HTML {step3-output: {postId: 12345, data: <html>}}
         - NOTE: We may not have to store the intermediate type in DO, CF seems to do it automatically
    - step 4: get post JSON and HTML from Durable oject step2-output, step3-output. Merge and format comments
    - step 5: call LLM summarize, resolve backlinks, save the summary to D1 
    - call DO summarizeNext()
        - DO:summarizeNext()
            - look up its storage and execute sql `select * from post_ids set summarized=false limit 1`
            - if there is a post, start an alarm this.storage.setAlarm(Date.now() + 10 * SECONDS);
                - alarm() handler: start the second workflow summarize_posts
            - else do nothing

