(function(ext) {
	ext.incomingBroadcasts = {};
	ext.vars = {};
	ext.partyFull = false;
	
	ext.playerID = 1;
	
	ext._shutdown = function() {
	
	};
	
	ext._getStatus = function() {
		return {status: 2, msg: 'Ready'};
	};
	
	ext.send = function(msg) {
		if(ext.isOpen) {
			ext.socket.send(JSON.stringify(msg));
		}
	}
	
	ext.connect = function(host, port, callback) {
		ext.socket = new WebSocket("ws://"+host+":"+port+"/", "mesh");
		ext.isOpen = false;
		
		ext.socket.onopen = function(e) {
			ext.isOpen = true;
			callback();
		}
		
		ext.socket.onmessage = function(e) {
			var message = JSON.parse(e.data);
			console.log(message);
			
			if(message.type == "broadcast") {
				ext.incomingBroadcasts[message.message] = true;
			} else if(message.type == "set") {
				ext.vars[message.varName] = message.value;
			} else if(message.type == "partyFull") {
				ext.partyFull = true;
				ext.playerID = message.playerID + 1;
			}
		}
		
		ext.socket.onclose = function(e) {
			ext.isOpen = false;
		}
		
		ext.socket.onerror = function(e) {
			ext.isOpen = false;
		}
	}
	
	ext.broadcast = function(message) {
		ext.send({
			type: "broadcast",
			message: message
		});
	}
	
	ext.whenIReceive = function(message) {
		if(ext.incomingBroadcasts[message]) {
			ext.incomingBroadcasts[message] = false;
			return true;
		} 
		
		return false;
	}
	
	ext.var = function(varName) {
		return ext.vars[varName] || "";
	}
	
	ext.setVar = function(varName, value) {
		ext.send({
			type: "set",
			varName: varName,
			value: value
		});
	}
	
	ext.partyCreate = function(name) {
		ext.send({
			type: "partyCreate",
			name: name,
		}); 
	}
	
	ext.partyJoin = function(name) {
		ext.send({
			type: "partyJoin",
			name: name,
		});
	}

	
	ext.partyJoinAny = function() {
		ext.send({
			type: "partyAny",
		});
	}
	
	ext.whenPartyFull = function() {
		if(ext.partyFull) {
			ext.partyFull = false;
			return true;
		}
		
		return false;
	}
	
	ext.getPlayerID = function() {
		return ext.playerID;
	}
	
	var descriptor = {
		blocks: [
			['w', 'connect to mesh server %s port %n', 'connect', 'localhost', 4354],
			
			[' ', 'broadcast %s', 'broadcast', 'message 1'],
			['h', 'when I receive %s', 'whenIReceive', 'message 1'],
			
			['r', 'value of %s', 'var', 'score'],
			[' ', 'set %s to %s', 'setVar', 'score', '10'],
			
			[' ', 'create group owned by %s', 'partyCreate', 'Scratch Cat'],
			[' ', 'join the group of %s', 'partyJoin', 'Scratch Cat'],
						
			[' ', 'join any group', 'partyJoinAny'],
			
			['h', 'when group is full', 'whenPartyFull'],
			
			['r', 'my player ID', 'getPlayerID']
		]
	};
	
	ScratchExtensions.register('Mesh', descriptor, ext);
})({});