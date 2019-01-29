var res = "images/"
var gameBoard
var pawnColor
var urlServer = "http://127.0.0.1:8899"
var peer,conn,turn
/*cambiare nome e valore pawnColor*/

function digify(n){ return n > 9 ? "" + n: "0" + n; }

function peerDisconnect(){
	console.log("disconnectiong peer")
	conn.close()
	peer.disconnect()
	peer.destroy()
}

function waitForResponse( pos ){
	$("#board").addClass('disabled') //.prop('disabled',true).off('click')
	conn.send( { 'turn':turn,'position':pos } )
}

function findGroups(acc, pos, color){
	if ( acc === undefined || acc.length == 0){
		acc.push(pos);
	}
	else if ( !acc.some(e => e.x === pos.x && e.y===pos.y) ){
		acc.push(pos);
	}
	else{
		return acc;
	}

	if( gameBoard[pos.x+1][pos.y] == color && pos.x < gameBoard[0].length){
		acc=findGroups(acc,{'x':pos.x+1,'y':pos.y},color);
	}
	if( gameBoard[pos.x][pos.y-1] == color && pos.y >= 0){
		acc=findGroups(acc,{'x':pos.x,'y':pos.y-1},color);
	}
	if( gameBoard[pos.x-1][pos.y] == color && pos.x >= 0){
		acc=findGroups(acc,{'x':pos.x-1,'y':pos.y},color);
	}
	if( gameBoard[pos.x][pos.y+1] == color && pos.y < gameBoard[0].length){
		acc=findGroups(acc,{'x':pos.x,'y':pos.y+1},color);
	}
	return acc;
}
	
function retrieveImage( cell, x, y, img, dimen ){
	var corner = "url(\""+res + img +"-corner.png\")";
	var edge = "url(\""+res + img +"-edge.png\")";

	if( x==1 && y==1 ){
		cell.style.backgroundImage = corner;
	}
	else if ( x==dimen && y==1 ){
		$(cell).css("transform", "rotate(270deg)");
		cell.style.backgroundImage = corner;
	}
	else if ( x==dimen && y==dimen ){
		$(cell).css("transform", "rotate(180deg)");
		cell.style.backgroundImage = corner;
	}
	else if ( x==1 && y==dimen ){
		$(cell).css("transform", "rotate(90deg)");
		cell.style.backgroundImage = corner;
	}
	else if( x == 1 ){
		cell.style.backgroundImage = edge;
	} 
	else if( y == 1 ){
		$(cell).css("transform", "rotate(270deg)");
		cell.style.backgroundImage = edge;
	}
	else if( y == dimen ){
		$(cell).css("transform", "rotate(90deg)");
		cell.style.backgroundImage = edge;
	}
	else if( x == dimen ) {
		$(cell).css("transform", "rotate(180deg)");
		cell.style.backgroundImage = edge;
	}
}


function placePawn(obj){
	var middle = Math.ceil( obj.length / 2);
	var x = parseInt(obj.slice(0,middle))-1;
	var y = parseInt(obj.slice(middle))-1;
	
	if( gameBoard [x][y] == 0 ){
		if( turn == 0 ){
			gameBoard[x][y] = 1;
			$('#'+obj).find('div:first').css('background-image','url(images/perla_nera.svg)');
		}
		else{
			gameBoard[x][y] = 2;
			$('#'+obj).find('div:first').css('background-image','url(images/perla_bbianca.svg)');
		}

		$('#'+obj).find('div:first').css('visibility','visible');
		$('#'+obj).unbind('mouseenter mouseleave');

		//var group = findGroups( new Array(),{'x': x, 'y': y}, 1);
		if(turn == pawnColor) waitForResponse( obj )
	}
}    

function setUpHandlers(){
	$(document).unload(function () {
		peerDisconnect();
	})
	$(window).unload(function(){
		/* rimuovere id dal server */
		sessionStorage.clear()
	})

}
	
function createBoard(dimen){
	var boardW = $('#board').width();
	
	var size = boardW/dimen;
	gameBoard = new Array(dimen).fill(dimen).map(() => new Array(dimen).fill(0));

	for(var r = 1; r <= dimen; r++){
		var row = document.createElement("div"); 
		row.className = "row";
		row.id = "row"+digify(r);
		row.style.height = size;

		for(var c = 1; c <= dimen; c++){ 
			/*creating a cell with the relative style*/
			var cell = document.createElement("div"); 
			cell.id = ""+digify(r)+digify(c);
			cell.className = "boardCell";
			cell.style.backgroundImage = "url(\""+res +"wood1-center.png\")";
			cell.style.width = size;
			cell.style.height = size;
			retrieveImage(cell, r, c, "wood1", dimen);				
			
			/*creating pawn and appending to the cell*/
			var pawn = document.createElement('div');
			pawn.className = 'pawn';
			pawn.style.width = size;
			pawn.style.height = size;
			
			cell.appendChild(pawn);

			/*handler functions
			modificare la funzione hover con lo straming dei dati*/
			$(cell).hover(function(){
				if(turn){
					$(this).find('div:first').css('background-image','url(images/perla_bbianca.svg)');
				}
				else{
					$(this).find('div:first').css('background-image','url(images/perla_nera.svg)');
				}
				
				$(this).find('div:first').css('visibility','visible');
			},function(){
				$(this).find('div:first').css('visibility','hidden');
			});

			$(cell).on('click',function(){
				placePawn( this.id ); 
			});
			
			row.appendChild(cell); 
		} 
		board.appendChild(row);
	}
}

function grayBoard(message){
	$("#board").addClass('disabled').addClass('grayed')
	$(".pawn").hide()

	var toInsert = $('<div id=\'errordiv\'>'+message+'</div>')
	var loc = $('#board').offset()
	toInsert.appendTo('#wrapper')
	toInsert.addClass('toInsert')
	toInsert.css('top', ($('#board').outerHeight()- toInsert.height())/2 + loc.top + 'px')
	toInsert.css('left', ($('#board').outerWidth() - toInsert.width())/2 + loc.left + 'px')
}

function ungrayBoard(){
	$("#board").removeClass('disabled').removeClass('grayed')
	$(".pawn").show()
	$('#errordiv').remove()
}

function sendPOSTforPeerIdEliminationtoServer ( peerToRemove ){
	if (peerToRemove != null){
		$.ajax({
			type:'post',
			url: urlServer+"/removePeer",
			dataType: "text/plain",
			data: JSON.stringify({ "id":  peerToRemove }),
			error: function(a,b,c){
				//alert(c,"staccah")
			}
		})
	}			
		
}	

function onConnectionOpen(mine, other){
	console.log('Hi ' + other + ' I am '+ mine, 'turn:',turn)
	conn.send( {'id': mine} )
	$('#board').addClass('disabled')
}

function updateTurn(t){
	turn = ( t+1 ) % 2
	$("#board").removeClass('disabled')
}

function updateBoard(msg){
	console.log(msg)
	turn = msg.turn
	console.log('Turno:', turn)

	placePawn( msg.position )
	updateTurn( turn )
}

$(document).ready(function(){
	/*TODO: dinamically create board here*/
	createBoard(19)

	setUpHandlers()
	
	var myID = sessionStorage.getItem('connectionID')
	var otherID =  sessionStorage.getItem('otherID') 

	if( myID == null ){
		grayBoard('Invalid ID')
	}
	else{
		peer = new Peer(myID)
		console.log('created peer '+ myID)
		turn = 0

		if(otherID != null){
			console.log("I have to connect with", otherID)
			conn = peer.connect(otherID)

			pawnColor = 1

			conn.on( 'open', function() {onConnectionOpen(myID,otherID)} )

			conn.on('data', function(message){
				if(message.turn != null){
					updateBoard(message)
				}
			})
			
		}
		else{
			console.log('waiting for peer')
			grayBoard('Waiting for player...')

			pawnColor = 0
			peer.on('connection', function(c) {
				conn = c
				conn.on('open', function() {
					console.log('established connection')
					ungrayBoard()
					sendPOSTforPeerIdEliminationtoServer(myID)
				})

				conn.on( 'data', function(message){
					console.log(message)
					if(message.id != null){
						otherID = message.id
						console.log('connection established with ',otherID,'Turno:',turn,'PawnColor',pawnColor)
					}
					else if( message.turn != null ){
						updateBoard(message)
					}
				});
			})
		}
	}
})