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

# Steps for HN summarize
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

# References
* [Workflows documentation](https://developers.cloudflare.com/workflows/) contains examples, the API reference, and architecture guidance.
* [Durable Objects Docs](https://developers.cloudflare.com/durable-objects/)
* [Alarm API](https://developers.cloudflare.com/durable-objects/api/alarms/)
* [Rules of Workflows](https://developers.cloudflare.com/workflows/build/rules-of-workflows/)