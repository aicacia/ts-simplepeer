import{v4 as n}from"https://unpkg.com/uuid@10/dist/esm-browser/index.js";import{EventEmitter as e}from"https://unpkg.com/eventemitter3@5/dist/eventemitter3.esm.min.js";const t={RTCPeerConnection:"undefined"==typeof RTCPeerConnection?null:RTCPeerConnection,RTCSessionDescription:"undefined"==typeof RTCSessionDescription?null:RTCSessionDescription,RTCIceCandidate:"undefined"==typeof RTCIceCandidate?null:RTCIceCandidate};class i extends e{constructor(e){super(),this.initiator=!1,this.maxChannelMessageSize=16384,this.trickle=!0,this.sdpTransform=o,this.config={iceServers:[]},this.pendingCandidates=[],this.webrtc=t,this.id=e.id||n(),this.channelName=e.channelName||n(),e.channelConfig&&(this.channelConfig=e.channelConfig),!1===e.trickle&&(this.trickle=!1),e.sdpTransform&&(this.sdpTransform=e.sdpTransform),e.config&&(this.config=e.config),e.offerConfig&&(this.offerConfig=e.offerConfig),e.answerConfig&&(this.answerConfig=e.answerConfig),e.maxChannelMessageSize&&e.maxChannelMessageSize>0&&(this.maxChannelMessageSize=e.maxChannelMessageSize),e.webrtc&&(this.webrtc=e.webrtc)}getId(){return this.id}getConnection(){return this.connection}getChannel(){return this.channel}isReady(){return this.channel&&"open"===this.channel.readyState}isClosed(){return!this.connection||"connected"!==this.connection.connectionState}ready(){return this.isReady()?Promise.resolve():this.waitOnce("connect")}isInitiator(){return this.initiator}init(){return this.initiator=!0,this.createPeer()}close(){return this.internalClose(!0)}send(n){if(!this.channel)throw new Error("Channel not initialized");return this.channel.send(n),this}write(n){if(!this.channel)throw new Error("Channel not initialized");return a(this.channel,n,this.maxChannelMessageSize)}writableStream(){if(!this.channel)throw new Error("Channel not initialized");return r(this.channel,this.maxChannelMessageSize)}readableStream(){if(!this.channel)throw new Error("Channel not initialized");return c(this.channel)}async signal(n){var e,t;switch(this.connection||await this.createPeer(),console.debug(`${this.id}: received signal message=${n.type}`),n.type){case"renegotiate":return this.negotiate();case"transceiverRequest":{if(!this.initiator)throw new Error("Invalid signal state");const e=n.transceiverRequest;if(!e)throw new Error("Invalid signal message");return await this.addTransceiverFromKind(e.kind,e.init),this}case"candidate":{if(!this.connection)throw new Error("Connection not initialized");const e=n.candidate;if(!e)throw new Error("Invalid signal message");const t=new this.webrtc.RTCIceCandidate(e);return null==this.connection.remoteDescription?this.pendingCandidates.push(t):await this.connection.addIceCandidate(t),this}case"answer":case"offer":case"pranswer":case"rollback":{if(!this.connection)throw new Error("Connection not initialized");const i=n.sdp;if(!i)throw new Error("Invalid signal message");const s=new this.webrtc.RTCSessionDescription({type:n.type,sdp:i});await this.connection.setRemoteDescription(s);for(const n of this.pendingCandidates)await this.connection.addIceCandidate(n);return this.pendingCandidates.length=0,"offer"===(null===(t=null===(e=this.connection)||void 0===e?void 0:e.remoteDescription)||void 0===t?void 0:t.type)&&await this.createAnswer(),this.emit("negotiated"),console.debug(`${this.id}: set remote sdp`),this}default:throw console.debug(`${this.id}: invalid signal type: ${n}`),new Error("Invalid signal message type")}}waitOnce(n){return new Promise((e=>{this.once(n,((...n)=>{switch(n.length){case 0:e(void 0);break;case 1:e(n[0]);break;default:e(n)}}))}))}addTransceiverFromKind(n,e){if(!this.connection)throw new Error("Connection not initialized");if(this.initiator){const t=this.connection.addTransceiver(n,e);return this.emit("transceiver",t),t}return this.internalSignal({type:"transceiverRequest",transceiverRequest:{kind:n,init:e}}),null}addTrack(n){if(!this.connection)throw new Error("Connection not initialized");return this.connection.addTrack(n)}removeTrack(n){if(!this.connection)throw new Error("Connection not initialized");return this.connection.removeTrack(n),this}internalSignal(n){return this.emit("signal",n),this}async negotiate(){if(!this.connection)throw new Error("Connection not initialized");return this.initiator?await this.createOffer():this.internalSignal({type:"renegotiate",renegotiate:!0}),this}async createOffer(){if(!this.connection)throw new Error("Connection not initialized");const n=await this.connection.createOffer(this.offerConfig);return this.trickle||(n.sdp=s(n.sdp)),n.sdp=this.sdpTransform(n.sdp),await this.connection.setLocalDescription(n),this.internalSignal({type:n.type,sdp:n.sdp}),this}async createAnswer(){if(!this.connection)throw new Error("Connection not initialized");const n=await this.connection.createAnswer(this.answerConfig);return this.trickle||(n.sdp=s(n.sdp)),n.sdp=this.sdpTransform(n.sdp),await this.connection.setLocalDescription(n),this.internalSignal({type:n.type,sdp:n.sdp}),this}createPeer(){if(this.internalClose(!1),this.connection=new this.webrtc.RTCPeerConnection(this.config),this.connection.addEventListener("negotiationneeded",this.onNegotiationNeeded.bind(this)),this.connection.addEventListener("iceconnectionstatechange",this.onICEConnectionStateChange.bind(this)),this.connection.addEventListener("icegatheringstatechange",this.onICEGatheringStateChange.bind(this)),this.connection.addEventListener("connectionstatechange",this.onConnectionStateChange.bind(this)),this.connection.addEventListener("icecandidate",this.onICECandidate.bind(this)),this.connection.addEventListener("signalingstatechange",this.onSignalingStateChange.bind(this)),this.connection.addEventListener("track",this.onTrackRemote.bind(this)),this.initiator){const n=this.connection.createDataChannel(this.channelName,this.channelConfig);n.addEventListener("open",this.onDataChannelOpen.bind(this)),n.addEventListener("message",this.onDataChannelMessage.bind(this)),n.addEventListener("error",this.onDataChannelError.bind(this)),this.channel=n}else this.connection.addEventListener("datachannel",this.onDataChannel.bind(this));return this}internalClose(n=!0){return this.channel&&(this.channel.close(),this.channel=void 0),this.connection&&(this.connection.close(),this.connection=void 0),n&&this.emit("close"),this}onConnectionStateChange(){if(this.connection)switch(this.connection.connectionState){case"connected":console.debug(`${this.id}: connection state connected`);break;case"failed":console.debug(`${this.id}: connection state failed`),this.internalClose(!0);break;case"disconnected":console.debug(`${this.id}: connection state disconnected`),this.internalClose(!0);break;case"closed":console.debug(`${this.id}: connection state closed`),this.internalClose(!0)}}onNegotiationNeeded(){if(this.connection)return this.negotiate()}onICEConnectionStateChange(){this.connection&&console.debug(`${this.id}: ice connection state ${this.connection.iceConnectionState}`)}onICEGatheringStateChange(){this.connection&&console.debug(`${this.id}: ice gathering state ${this.connection.iceGatheringState}`)}onSignalingStateChange(){this.connection&&console.debug(`${this.id}: signaling state ${this.connection.signalingState}`)}onICECandidate(n){n.candidate&&this.internalSignal({type:"candidate",candidate:n.candidate})}onTrackRemote(n){this.emit("track",n)}onDataChannel(n){const e=n.channel;this.channel=e,this.channel.onopen=this.onDataChannelOpen.bind(this),this.channel.onmessage=this.onDataChannelMessage.bind(this),this.channel.onerror=this.onDataChannelError.bind(this)}onDataChannelOpen(){console.debug(`${this.id}: data channel open`),this.emit("connect")}onDataChannelMessage(n){this.emit("data",n.data)}onDataChannelError(n){this.emit("error",new Error("DataChannel error",{cause:n}))}}function s(n){return null==n?void 0:n.replace(/a=ice-options:trickle\s\n/g,"")}function o(n){return n}function a(n,e,t){if("string"==typeof e)if(e.length<t)n.send(e);else{let i=0;for(;i<e.length;){const s=Math.min(t,e.length-i);n.send(e.substring(i,i+s)),i+=s}}else if(e instanceof Blob)if(e.size<t)n.send(e);else{let i=0;for(;i<e.size;){const s=Math.min(t,e.size-i);n.send(e.slice(i,i+s)),i+=s}}else{let i;if(i=e instanceof ArrayBuffer?e:e.buffer,i.byteLength<t)n.send(i);else{let e=0;for(;e<i.byteLength;){const s=Math.min(t,i.byteLength-e);n.send(i.slice(e,e+s)),e+=s}}}}function r(n,e){return new WritableStream({write(t){a(n,t,e)}})}function c(n){let e=!1,t=!1;const i=[],s=[];function o(n){if(s.length){const[e,t]=s.shift();e(n.data)}else i.push(n.data)}n.addEventListener("message",o);const a=()=>{if(!e){n.removeEventListener("message",o),n.removeEventListener("close",a),e=!0;for(const[n,e]of s)e(new Error("Stream closed"));s.length=0,i.length=0}};return n.addEventListener("close",a),new ReadableStream({async pull(n){e?t||(t=!0,n.close()):i.length?n.enqueue(i.shift()):n.enqueue(await new Promise(((n,e)=>s.push([n,e]))))},cancel:a})}export{i as Peer,c as readableStreamFromChannel,r as writableStreamFromChannel};
//# sourceMappingURL=index.js.map
