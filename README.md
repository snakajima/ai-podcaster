# ai-podcaster

## Initialization

```
yarn install
```
create .env file with your OpenAI key
```
OPENAI_API_KEY={your OpenAI key}
```

## Create a podcast episode

1. Feed some source text (ideas, news, press releases) to your favarite LLM.
2. Ask the LLM to write a podcast script in JSON (use the contents of "./prompt.md").
3. Create a json file with that generated JSON (such as ./scripts/elon.json)
4. Run ```yarn run gen {path to the script file}```.
5. The output will be generated in the ./output folder.

## Translate the script into Japanese

Run ```yarn run ja {path to the script file}```

## Create a movie file with the Japanese script

Run ```yarn run mov {path to the script file}```
