from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
import json,subprocess,wave,textwrap,html
import imageio_ffmpeg
root=Path(__file__).parent;out=root/'captures';generated=root/'generated';generated.mkdir(exist_ok=True);ff=imageio_ffmpeg.get_ffmpeg_exe()
def font(n,b=False):
    paths=['/System/Library/Fonts/Supplemental/Arial'+(' Bold' if b else '')+'.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if b else '')+'.ttf']
    for path in paths:
        if Path(path).exists():return ImageFont.truetype(path,n)
    return ImageFont.load_default(size=n)
scenes=json.loads((root/'story.json').read_text());pcm=bytearray();cues=[];panels=[];position=0
for i,s in enumerate(scenes):
    wav=generated/f'voice-{i:02}.wav'
    subprocess.run([ff,'-v','error','-y','-i',str(generated/f'voice-{i:02}.mp3'),'-ac','1','-ar','24000','-c:a','pcm_s16le',str(wav)],check=True)
    with wave.open(str(wav)) as stream:
        duration=stream.getnframes()/stream.getframerate();pcm.extend(stream.readframes(stream.getnframes()))
    silence=s['pause'];pcm.extend(b'\0'*round(24000*silence)*2)
    words=[json.loads(line) for line in (generated/f'voice-{i:02}.jsonl').read_text().splitlines() if json.loads(line).get('type')=='WordBoundary']
    assert words,'Missing word timings'
    original=s['text'].split();assert len(original)==len(words),'Word timing/text alignment mismatch'
    for item,text in zip(words,original):item['text']=text
    groups=[];group=[]
    for word in words:
        group.append(word)
        if len(group)>=15 or (len(group)>=6 and word['text'].endswith(('.', '?', '!'))):groups.append(group);group=[]
    if group:groups.append(group)
    for j,g in enumerate(groups):
        start=0 if j==0 else g[0]['offset']/10000000
        end=groups[j+1][0]['offset']/10000000 if j+1<len(groups) else duration+silence
        assert end>start
        caption=html.unescape(' '.join(w['text'] for w in g))
        image=s.get('image2') if s.get('image2') and j>=len(groups)/2 else s['image']
        shot=Image.open(out/image).convert('RGB')
        shot=shot.crop(tuple(s.get('crop',[0,242,shot.width,shot.height])))
        shot=ImageOps.contain(shot,(1816,734),Image.Resampling.LANCZOS)
        frame=Image.new('RGB',(1920,1080),'#0a0b0d');d=ImageDraw.Draw(frame)
        d.rounded_rectangle((48,25,78,55),radius=5,fill='#bfff3c')
        for yy in [32,39,46]:d.line((55,yy,71,yy),fill='#202915',width=2)
        d.text((91,28),'DEVSQUAD',font=font(21,True),fill='#e5e7eb')
        d.text((1731,30),f'{i+1:02} / {len(scenes):02}',font=font(17),fill='#858b95')
        d.text((48,69),s['title'],font=font(38,True),fill='#e5e7eb')
        d.rounded_rectangle((47,129,1873,884),radius=6,fill='#101215',outline='#30353c',width=1)
        frame.paste(shot,((1920-shot.width)//2,141+(730-shot.height)//2))
        lines=textwrap.wrap(caption,width=100);assert len(lines)<=2
        y=925 if len(lines)==1 else 908
        for line in lines:
            bounds=d.textbbox((0,0),line,font=font(29));d.text(((1920-bounds[2])//2,y),line,font=font(29),fill='#e5e7eb');y+=39
        d.rectangle((48,1009,1872,1012),fill='#26292e')
        d.rectangle((48,1009,48+int(1824*(i+(j+1)/len(groups))/len(scenes)),1012),fill='#bfff3c')
        d.text((48,1037),'ACTUAL EDITED APPLICATION CAPTURES  /  SYNTHETIC NARRATION  /  GENHACKS 2026',font=font(13),fill='#858b95')
        path=generated/f'frame-{len(panels):03}.png';frame.save(path)
        panels.append((path,end-start));cues.append({'start':position+start,'end':position+end,'text':caption,'scene':i+1})
    position+=duration+silence
    s['audio_duration']=duration
assert position<180,f'Video too long: {position:.2f}s'
with wave.open(str(generated/'narration.wav'),'wb') as stream:
    stream.setnchannels(1);stream.setsampwidth(2);stream.setframerate(24000);stream.writeframes(pcm)
lines=[]
for path,length in panels:lines.extend(["file '"+str(path.resolve())+"'",f'duration {length:.6f}'])
lines.append("file '"+str(panels[-1][0].resolve())+"'")
(generated/'frames.txt').write_text('\n'.join(lines))
def stamp(value):
    ms=round(value*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
(generated/'captions.srt').write_text('\n\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n{c["text"]}' for i,c in enumerate(cues)))
(generated/'timeline.json').write_text(json.dumps({'duration':position,'voice':'en-US-AndrewMultilingualNeural','timing':'actual TTS WordBoundary offsets','cues':cues,'scenes':scenes,'disclosure':'Synthetic narration; edited actual application captures'},indent=2))
print(f'Rendering {position:.2f} seconds, {len(panels)} accurately timed caption panels',flush=True)
subprocess.run([ff,'-y','-v','error','-f','concat','-safe','0','-i',str(generated/'frames.txt'),'-i',str(generated/'narration.wav'),'-vf','fps=24','-af','loudnorm=I=-16:TP=-1.5:LRA=9','-c:v','libx264','-threads','4','-preset','fast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart','-shortest',str(generated/'DevSquad-demo.mp4')],check=True)
print('Rendered DevSquad-demo.mp4',flush=True)
