"""Create small original feedback tones; no remote sound assets or samples."""
from pathlib import Path
import math, random, struct, wave
dest=Path(__file__).resolve().parents[1]/'assets'/'audio'
dest.mkdir(parents=True,exist_ok=True)
random.seed(12)
for name,length in [('strike',.22),('skill',.42),('reward',.75)]:
    samples=[]
    for i in range(int(22050*length)):
        time=i/22050
        envelope=min(1,time/.008)*math.exp(-time*(20 if name=='strike' else 7))
        if name=='strike': value=(random.uniform(-1,1)*.35+math.sin(2*math.pi*(760-time*1400)*time)*.22+math.sin(2*math.pi*1240*time)*.2)*envelope
        elif name=='skill': value=(math.sin(2*math.pi*(380+time*1600)*time)*.3+math.sin(2*math.pi*880*time)*.2)*envelope
        else:
            chord=[523.25,659.25,783.99]
            value=sum(math.sin(2*math.pi*f*time)*math.exp(-max(0,time-j*.08)*4)*(time>=j*.08) for j,f in enumerate(chord))*.14*min(1,time/.01)
        samples.append(struct.pack('<h',int(max(-1,min(1,value))*.6*32767)))
    with wave.open(str(dest/(name+'.wav')),'wb') as file:
        file.setnchannels(1);file.setsampwidth(2);file.setframerate(22050);file.writeframes(b''.join(samples))

# Original cave atmosphere: short distant creature murmurs and water drops.
samples=[]
for i in range(22050*4):
    time=i/22050
    value=0.0
    for start,length,pitch in [(0.35,.42,126),(1.1,.32,172),(2.3,.56,108)]:
        local=time-start
        if 0<=local<length:
            envelope=math.sin(math.pi*local/length)**2
            flutter=1+.1*math.sin(local*53)
            value+=(math.sin(2*math.pi*pitch*flutter*local)*.2+math.sin(2*math.pi*pitch*2.3*local)*.11+random.uniform(-1,1)*.045)*envelope
            # A soft delayed echo keeps the voice behind the tunnel bend.
        echo=local-.18
        if 0<=echo<length:
            value+=math.sin(2*math.pi*pitch*echo)*.045*math.sin(math.pi*echo/length)**2
    for start in [0.05,1.75,3.4]:
        local=time-start
        if 0<local<.17:
            value+=math.sin(2*math.pi*(1750-local*2000)*local)*math.exp(-local*34)*.06
    samples.append(struct.pack('<h',int(max(-1,min(1,value))*.65*32767)))
with wave.open(str(dest/'cave.wav'),'wb') as file:
    file.setnchannels(1);file.setsampwidth(2);file.setframerate(22050);file.writeframes(b''.join(samples))
