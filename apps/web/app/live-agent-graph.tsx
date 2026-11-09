'use client';
import {useMemo} from 'react';
import {ReactFlow,ReactFlowProvider,Background,Position} from '@xyflow/react';
import {squad,phaseRole,type WorkerRun,type WorkerEvent} from '@devsquad/core';
export default function LiveAgentGraph({run,events}:{run:WorkerRun;events:WorkerEvent[]}){
 const nodes=useMemo(()=>squad.map((a,i)=>({id:a.id,position:{x:i*190,y:0},sourcePosition:Position.Right,targetPosition:Position.Left,width:165,height:88,data:{label:<div><b>{a.name}</b><span>{a.role}</span><small>{events.filter(e=>e.role===a.id).length} events</small></div>},style:{width:165,height:88,background:'#131619',color:'#e5e7eb',border:run.status==='RUNNING'&&phaseRole[run.phase]===a.id?'1px solid #bfff3c':'1px solid #30363d',borderRadius:6}})),[run.status,run.phase,events]);
 const edges=useMemo(()=>squad.slice(1).map((a,i)=>({id:squad[i].id+'-'+a.id,source:squad[i].id,target:a.id,animated:run.status==='RUNNING'&&phaseRole[run.phase]===a.id,style:{stroke:'#596735'}})),[run.status,run.phase]);
 return <div className="worker-live-canvas" aria-label="Live role graph"><ReactFlowProvider><ReactFlow id="live-squad" nodes={nodes} edges={edges} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} panOnDrag={false} zoomOnScroll={false} fitView fitViewOptions={{padding:.15}} defaultViewport={{x:10,y:20,zoom:1}} minZoom={.3} maxZoom={1.2} colorMode="dark"><Background color="#2a2d32" gap={20}/></ReactFlow></ReactFlowProvider></div>;
}
