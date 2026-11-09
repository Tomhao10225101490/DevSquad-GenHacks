import asyncio,json,pathlib,edge_tts
root=pathlib.Path(__file__).parent
generated=root/'generated';generated.mkdir(exist_ok=True)
async def speak(i,scene,sem):
    path=generated/f'voice-{i:02}.mp3'
    metadata=generated/f'voice-{i:02}.jsonl'
    if path.exists() and path.stat().st_size>1000 and metadata.exists():return
    async with sem:
        for attempt in range(3):
            try:
                tmp=path.with_suffix('.tmp.mp3')
                await asyncio.wait_for(edge_tts.Communicate(scene['text'],'en-US-AndrewMultilingualNeural',rate=scene['rate'],boundary='WordBoundary').save(str(tmp),str(metadata)),55)
                tmp.replace(path);print(f'Segment {i+1}: generated',flush=True);return
            except Exception as error:
                print(f'Segment {i+1}: retry {attempt+1}, {type(error).__name__}',flush=True)
                if attempt==2:raise
                await asyncio.sleep(2)
async def main():
    sem=asyncio.Semaphore(2)
    await asyncio.gather(*(speak(i,s,sem) for i,s in enumerate(json.loads((root/'story.json').read_text()))))
asyncio.run(main())
