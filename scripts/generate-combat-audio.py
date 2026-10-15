"""Generate original short combat cues. Deterministic synthesis; no external samples."""
import math, random, struct, wave
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'assets'/'audio'
rate=22050
for index,(name,duration) in enumerate([('fire',.32),('frost',.42),('venom',.35),('bone',.18),('pack',.32),('skitter',.23),('phase',.7)]):
 rng=random.Random(731+index);samples=[]
 for n in range(int(rate*duration)):
  t=n/rate;p=t/duration;env=math.sin(math.pi*min(1,p/.06)/2)*(1-p)**1.6;noise=rng.uniform(-1,1)
  if name=='fire':v=noise*.55+math.sin(2*math.pi*(180*t-100*t*t))*.45
  elif name=='frost':v=sum(math.sin(2*math.pi*f*t)*math.exp(-t*6) for f in (880,1320,1760))/3
  elif name=='venom':v=math.sin(2*math.pi*(120*t+35*math.sin(t*24)))*.5+noise*.2
  elif name=='bone':v=noise*.6*math.exp(-t*24)+math.sin(t*2600)*.4*math.exp(-t*16)
  elif name=='pack':v=math.sin(2*math.pi*(78*t+12*t*t))*.55+noise*.25+math.sin(t*1100)*.2
  elif name=='skitter':v=(math.sin(t*8000)*.5+noise*.5)*(.3+.7*max(0,math.sin(t*95)))
  else:v=sum(math.sin(2*math.pi*(f*t+80*t*t)) for f in (220,277.18,329.63))/3
  samples.append(max(-32767,min(32767,round(v*env*.5*32767))))
 with wave.open(str(root/(name+'.wav')),'wb') as out:
  out.setparams((1,2,rate,len(samples),'NONE','not compressed'));out.writeframes(struct.pack('<'+'h'*len(samples),*samples))
 print(name,len(samples),'samples')
