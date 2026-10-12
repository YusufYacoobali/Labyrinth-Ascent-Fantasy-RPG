import React,{useState} from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { Button,Choice,Copy,Nav } from '@/components/game-ui';
import { OnboardingScreen } from '@/screens/onboarding';

// Temporary visual QA fixture. Removed before the final game export.
export default function VisualReview(){
 const {mode}=useLocalSearchParams();const [active,setActive]=useState('Labyrinth');
 if(mode==='onboarding')return <SafeAreaInsetsContext.Provider value={{top:59,bottom:34,left:0,right:0}}><OnboardingScreen/></SafeAreaInsetsContext.Provider>;
 return <View style={{flex:1,backgroundColor:'#080f19',maxWidth:460,width:'100%',alignSelf:'center',justifyContent:'space-between'}}>
  <View style={{padding:15,gap:12}}><Copy title>Mock control comparison</Copy><Choice label="Take the sword" detail="It could be powerful." icon="sword" tone="gold" onPress={()=>{}}/><Choice label="Examine it carefully" detail="Learn more before deciding." icon="magnify" tone="blue" onPress={()=>{}}/><Choice label="Leave it be" detail="Some things are best untouched." icon="alert-outline" tone="red" onPress={()=>{}}/>
   {['Home','Party','Labyrinth','Journal','More'].map(name=><Button key={name} small label={'Preview '+name} tone="dark" onPress={()=>setActive(name)}/>)}</View>
  <Nav active={active}/>
 </View>;
}
